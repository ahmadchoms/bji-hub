import type { DataRepository } from "@/lib/data/contract";
import { admin } from "@/lib/data/prisma/admin";
import { analytics } from "@/lib/data/prisma/analytics";
import { catalog } from "@/lib/data/prisma/catalog";
import { money } from "@/lib/data/prisma/money";
import { sellers } from "@/lib/data/prisma/sellers";

export const prismaRepository: DataRepository = { ...catalog, ...sellers, ...money, ...admin, ...analytics };
