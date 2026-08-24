import "server-only";

import { redirect } from "next/navigation";

import { getCurrentUser } from "@/app/lib/auth";

export async function getCurrentAdminUser() {
    const user = await getCurrentUser();

    if (!user || user.role !== "admin") {
        return null;
    }

    return user;
}

export async function requireAdminUser() {
    const user = await getCurrentAdminUser();

    if (!user) {
        redirect("/admin/login");
    }

    return user;
}
