import { randomUUID } from "node:crypto";
import { and, desc, eq, gte, inArray } from "drizzle-orm";
import { Router, type IRouter } from "express";
import { getAuth } from "@clerk/express";
import { db } from "@workspace/db";
import {
  businessesTable,
  branchesTable,
  insertBranchSchema,
  insertBusinessSchema,
  insertServiceRequestSchema,
  insertServiceSchema,
  insertStaffProfileSchema,
  insertTableSchema,
  serviceRequestsTable,
  servicesTable,
  staffProfilesTable,
  tablesTable,
} from "@workspace/db";
import {
  CreateGuestRequestBody,
  CreateGuestRequestParams,
  CreateTableBody,
  GetGuestRequestParams,
  GetGuestTableParams,
  ListRequestsQueryParams,
  UpdateRequestStatusBody,
  UpdateRequestStatusParams,
} from "@workspace/api-zod";

const router: IRouter = Router();
const ACTIVE_STATUSES = ["REQUESTED", "ACCEPTED", "IN_PROGRESS"] as const;

type Operator = {
  clerkId: string;
  name: string;
  email: string;
  business: typeof businessesTable.$inferSelect;
  branch: typeof branchesTable.$inferSelect;
};

function authUser(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  const auth = getAuth(req);
  const userId = auth?.userId;
  if (!userId) return null;
  const claims = auth.sessionClaims as
    | { email?: string; email_address?: string; name?: string }
    | undefined;
  return {
    clerkId: userId,
    email: claims?.email ?? claims?.email_address ?? "operator@hospitality.local",
    name: claims?.name ?? "Hospitality operator",
  };
}

async function createWorkspace(ownerClerkId: string, name: string, slug: string) {
  return db.transaction(async (tx) => {
    const [business] = await tx
      .insert(businessesTable)
      .values(
        insertBusinessSchema.parse({
          name,
          slug,
          ownerClerkId,
        }),
      )
      .returning();
    const [branch] = await tx
      .insert(branchesTable)
      .values(
        insertBranchSchema.parse({
          businessId: business.id,
          name: "Main branch",
        }),
      )
      .returning();

    const serviceValues = [
      ["Call waiter", "concierge-bell", "Waiters", "NORMAL"],
      ["Request water", "glass-water", "Waiters", "NORMAL"],
      ["Request bill", "receipt", "Waiters", "NORMAL"],
      ["Clean table", "sparkles", "Cleaning", "NORMAL"],
      ["Request assistance", "life-buoy", "Management", "HIGH"],
    ].map(([serviceName, icon, department, priority]) =>
      insertServiceSchema.parse({
        businessId: business.id,
        name: serviceName,
        icon,
        department,
        priority,
        active: true,
      }),
    );
    await tx.insert(servicesTable).values(serviceValues);

    const tableValues = [
      ["table-12", "Table 12", "Main dining"],
      ["table-07", "Table 7", "Main dining"],
      ["table-04", "Table 4", "Terrace"],
    ].map(([code, tableName, area]) =>
      insertTableSchema.parse({
        businessId: business.id,
        branchId: branch.id,
        code,
        name: tableName,
        area,
        active: true,
      }),
    );
    await tx.insert(tablesTable).values(tableValues);
    await tx.insert(staffProfilesTable).values(
      [
        ["Marta G.", "Waiters", "AVAILABLE"],
        ["Noah K.", "Waiters", "BUSY"],
        ["Ava R.", "Cleaning", "OFFLINE"],
      ].map(([staffName, department, status]) =>
        insertStaffProfileSchema.parse({
          businessId: business.id,
          name: staffName,
          department,
          status,
        }),
      ),
    );
    return { business, branch };
  });
}

async function getOperator(req: Parameters<Parameters<typeof router.get>[1]>[0]) {
  const user = authUser(req);
  if (!user) return null;

  let [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.ownerClerkId, user.clerkId))
    .limit(1);

  if (!business) {
    const slug = `workspace-${user.clerkId.slice(-8).toLowerCase()}`;
    const workspace = await createWorkspace(
      user.clerkId,
      "Your hospitality space",
      slug,
    );
    business = workspace.business;
  }

  let [branch] = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.businessId, business.id))
    .limit(1);
  if (!branch) {
    [branch] = await db
      .insert(branchesTable)
      .values({ businessId: business.id, name: "Main branch" })
      .returning();
  }

  return { ...user, business, branch } satisfies Operator;
}

async function getDemoWorkspace() {
  let [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, "hotel-sunrise"))
    .limit(1);
  if (!business) {
    return createWorkspace("demo-owner", "Hotel Sunrise", "hotel-sunrise");
  }
  const [branch] = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.businessId, business.id))
    .limit(1);
  if (!branch) return createWorkspace("demo-owner", "Hotel Sunrise", "hotel-sunrise");
  return { business, branch };
}

function businessResponse(
  business: typeof businessesTable.$inferSelect,
  branch: typeof branchesTable.$inferSelect,
) {
  return {
    id: business.id,
    name: business.name,
    slug: business.slug,
    branchName: branch.name,
  };
}

async function requestRows(businessId: number, limit = 25, status?: string) {
  const conditions = [eq(serviceRequestsTable.businessId, businessId)];
  if (status) conditions.push(eq(serviceRequestsTable.status, status));
  const rows = await db
    .select({
      request: serviceRequestsTable,
      table: tablesTable,
      service: servicesTable,
    })
    .from(serviceRequestsTable)
    .innerJoin(tablesTable, eq(serviceRequestsTable.tableId, tablesTable.id))
    .innerJoin(servicesTable, eq(serviceRequestsTable.serviceId, servicesTable.id))
    .where(and(...conditions))
    .orderBy(desc(serviceRequestsTable.createdAt))
    .limit(limit);
  return rows.map(({ request, table, service }) => ({
    id: request.id,
    trackingToken: request.trackingToken,
    tableName: table.name,
    tableArea: table.area,
    serviceName: service.name,
    serviceIcon: service.icon,
    priority: request.priority,
    status: request.status,
    note: request.note,
    assignedTo: request.assignedTo,
    createdAt: request.createdAt.toISOString(),
    updatedAt: request.updatedAt.toISOString(),
  }));
}

router.get("/me", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  res.json({
    id: operator.clerkId,
    name: operator.name,
    email: operator.email,
    role: "OWNER",
    business: businessResponse(operator.business, operator.branch),
  });
});

router.get("/dashboard", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const todayRows = await db
    .select()
    .from(serviceRequestsTable)
    .where(
      and(
        eq(serviceRequestsTable.businessId, operator.business.id),
        gte(serviceRequestsTable.createdAt, startOfToday),
      ),
    );
  const active = todayRows.filter((row) =>
    ACTIVE_STATUSES.includes(row.status as (typeof ACTIVE_STATUSES)[number]),
  ).length;
  const responseTimes = todayRows
    .filter((row) => row.acceptedAt)
    .map((row) => row.acceptedAt!.getTime() - row.createdAt.getTime());
  const averageResponseSeconds = responseTimes.length
    ? Math.round(
        responseTimes.reduce((total, value) => total + value, 0) /
          responseTimes.length /
          1000,
      )
    : 0;
  const staff = await db
    .select()
    .from(staffProfilesTable)
    .where(eq(staffProfilesTable.businessId, operator.business.id));
  res.json({
    business: businessResponse(operator.business, operator.branch),
    stats: {
      active,
      today: todayRows.length,
      completed: todayRows.filter((row) => row.status === "COMPLETED").length,
      averageResponseSeconds,
    },
    requests: await requestRows(operator.business.id, 25),
    staff: staff.map((person) => ({
      id: person.id,
      name: person.name,
      department: person.department,
      status: person.status,
    })),
  });
});

router.get("/tables", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const rows = await db
    .select()
    .from(tablesTable)
    .where(eq(tablesTable.branchId, operator.branch.id))
    .orderBy(tablesTable.name);
  const requests = await db
    .select({ tableId: serviceRequestsTable.tableId })
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.businessId, operator.business.id));
  res.json(
    rows.map((table) => ({
      id: table.id,
      code: table.code,
      name: table.name,
      area: table.area,
      active: table.active,
      guestPath: `/guest/${operator.business.slug}/${table.code}`,
      requestCount: requests.filter((row) => row.tableId === table.id).length,
    })),
  );
});

router.post("/tables", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const parsed = CreateTableBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const code = `table-${parsed.data.name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${randomUUID().slice(0, 4)}`;
  const [table] = await db
    .insert(tablesTable)
    .values({
      businessId: operator.business.id,
      branchId: operator.branch.id,
      code,
      name: parsed.data.name,
      area: parsed.data.area,
      active: true,
    })
    .returning();
  res.status(201).json({
    id: table.id,
    code: table.code,
    name: table.name,
    area: table.area,
    active: table.active,
    guestPath: `/guest/${operator.business.slug}/${table.code}`,
    requestCount: 0,
  });
});

router.get("/services", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const services = await db
    .select()
    .from(servicesTable)
    .where(
      and(eq(servicesTable.businessId, operator.business.id), eq(servicesTable.active, true)),
    )
    .orderBy(servicesTable.id);
  res.json(services);
});

router.get("/requests", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const parsed = ListRequestsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  res.json(await requestRows(operator.business.id, parsed.data.limit, parsed.data.status));
});

router.patch("/requests/:id/status", async (req, res): Promise<void> => {
  const operator = await getOperator(req);
  if (!operator) {
    res.status(401).json({ error: "Authentication required" });
    return;
  }
  const params = UpdateRequestStatusParams.safeParse(req.params);
  const body = UpdateRequestStatusBody.safeParse(req.body);
  if (!params.success || !body.success) {
    res.status(400).json({ error: "Invalid request status" });
    return;
  }
  const [existing] = await db
    .select()
    .from(serviceRequestsTable)
    .where(
      and(
        eq(serviceRequestsTable.id, params.data.id),
        eq(serviceRequestsTable.businessId, operator.business.id),
      ),
    )
    .limit(1);
  if (!existing) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const allowedTransitions: Record<string, readonly string[]> = {
    REQUESTED: ["ACCEPTED", "DECLINED", "CANCELLED"],
    ACCEPTED: ["IN_PROGRESS", "CANCELLED"],
    IN_PROGRESS: ["COMPLETED", "CANCELLED"],
    COMPLETED: [],
    DECLINED: [],
    CANCELLED: [],
  };
  if (!allowedTransitions[existing.status]?.includes(body.data.status)) {
    res.status(409).json({
      error: `Cannot move a ${existing.status.toLowerCase()} request to ${body.data.status.toLowerCase()}`,
    });
    return;
  }

  const now = new Date();
  await db
    .update(serviceRequestsTable)
    .set({
      status: body.data.status,
      assignedTo:
        body.data.status === "ACCEPTED" || body.data.status === "IN_PROGRESS"
          ? operator.name
          : existing.assignedTo,
      acceptedAt:
        body.data.status === "ACCEPTED" && !existing.acceptedAt
          ? now
          : existing.acceptedAt,
      completedAt: body.data.status === "COMPLETED" ? now : existing.completedAt,
      updatedAt: now,
    })
    .where(eq(serviceRequestsTable.id, existing.id));
  const updated = await requestRows(operator.business.id, 100);
  const response = updated.find((request) => request.id === existing.id);
  res.json(response);
});

router.get("/guest/requests/:trackingToken", async (req, res): Promise<void> => {
  const params = GetGuestRequestParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [request] = await db
    .select({ businessId: serviceRequestsTable.businessId })
    .from(serviceRequestsTable)
    .where(eq(serviceRequestsTable.trackingToken, params.data.trackingToken))
    .limit(1);
  if (!request) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  const rows = await requestRows(request.businessId, 100);
  const response = rows.find(
    (candidate) => candidate.trackingToken === params.data.trackingToken,
  );
  if (!response) {
    res.status(404).json({ error: "Request not found" });
    return;
  }
  res.json(response);
});

router.get("/guest/:businessSlug/:tableCode", async (req, res): Promise<void> => {
  const params = GetGuestTableParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  let [business] = await db
    .select()
    .from(businessesTable)
    .where(eq(businessesTable.slug, params.data.businessSlug))
    .limit(1);
  if (!business && params.data.businessSlug === "hotel-sunrise") {
    ({ business } = await getDemoWorkspace());
  }
  if (!business) {
    res.status(404).json({ error: "Business not found" });
    return;
  }
  const [branch] = await db
    .select()
    .from(branchesTable)
    .where(eq(branchesTable.businessId, business.id))
    .limit(1);
  const [table] = branch
    ? await db
        .select()
        .from(tablesTable)
        .where(
          and(
            eq(tablesTable.branchId, branch.id),
            eq(tablesTable.code, params.data.tableCode),
            eq(tablesTable.active, true),
          ),
        )
        .limit(1)
    : [];
  if (!branch || !table) {
    res.status(404).json({ error: "Table not found" });
    return;
  }
  const services = await db
    .select()
    .from(servicesTable)
    .where(
      and(eq(servicesTable.businessId, business.id), eq(servicesTable.active, true)),
    )
    .orderBy(servicesTable.id);
  res.json({
    businessName: business.name,
    businessSlug: business.slug,
    branchName: branch.name,
    tableName: table.name,
    tableCode: table.code,
    services,
  });
});

router.post(
  "/guest/:businessSlug/:tableCode/requests",
  async (req, res): Promise<void> => {
    const params = CreateGuestRequestParams.safeParse(req.params);
    const body = CreateGuestRequestBody.safeParse(req.body);
    if (!params.success || !body.success) {
      res.status(400).json({ error: "Invalid service request" });
      return;
    }
    const [business] = await db
      .select()
      .from(businessesTable)
      .where(eq(businessesTable.slug, params.data.businessSlug))
      .limit(1);
    if (!business) {
      res.status(404).json({ error: "Business not found" });
      return;
    }
    const [branch] = await db
      .select()
      .from(branchesTable)
      .where(eq(branchesTable.businessId, business.id))
      .limit(1);
    const [table] = branch
      ? await db
          .select()
          .from(tablesTable)
          .where(
            and(
              eq(tablesTable.branchId, branch.id),
              eq(tablesTable.code, params.data.tableCode),
              eq(tablesTable.active, true),
            ),
          )
          .limit(1)
      : [];
    const [service] = await db
      .select()
      .from(servicesTable)
      .where(
        and(
          eq(servicesTable.id, body.data.serviceId),
          eq(servicesTable.businessId, business.id),
          eq(servicesTable.active, true),
        ),
      )
      .limit(1);
    if (!branch || !table || !service) {
      res.status(404).json({ error: "Table or service not found" });
      return;
    }

    const recentCutoff = new Date(Date.now() - 90_000);
    const [duplicate] = await db
      .select()
      .from(serviceRequestsTable)
      .where(
        and(
          eq(serviceRequestsTable.tableId, table.id),
          eq(serviceRequestsTable.serviceId, service.id),
          inArray(serviceRequestsTable.status, [...ACTIVE_STATUSES]),
          gte(serviceRequestsTable.createdAt, recentCutoff),
        ),
      )
      .limit(1);
    if (duplicate) {
      const duplicateRows = await requestRows(business.id, 100);
      res.status(201).json(
        duplicateRows.find((request) => request.id === duplicate.id),
      );
      return;
    }

    const [request] = await db
      .insert(serviceRequestsTable)
      .values(
        insertServiceRequestSchema.parse({
          businessId: business.id,
          branchId: branch.id,
          tableId: table.id,
          serviceId: service.id,
          trackingToken: randomUUID(),
          priority: service.priority,
          status: "REQUESTED",
          note: body.data.note ?? null,
        }),
      )
      .returning();
    const rows = await requestRows(business.id, 100);
    res.status(201).json(rows.find((row) => row.id === request.id));
  },
);

export default router;
