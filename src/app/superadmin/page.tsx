"use client";

import React from "react";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ShieldAlert, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function SuperAdminPage() {
  return (
    <div className="max-w-xl mx-auto py-20 px-4 text-center space-y-6">
      <Card className="p-8 space-y-5 border-slate-200 dark:border-dark-border">
        <div className="w-16 h-16 mx-auto rounded-3xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <CardHeader className="p-0">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">
            SuperAdmin Portal Deactivated
          </CardTitle>
          <CardDescription className="text-sm text-slate-500 mt-2">
            This deployment of Qlinic v2 is configured as a dedicated clinic instance for PetPals Veterinary Clinic.
            Multi-tenant SaaS administrative controls are disabled on production.
          </CardDescription>
        </CardHeader>
        <div className="pt-4">
          <Link href="/">
            <Button variant="primary" size="md" leftIcon={<ArrowLeft className="w-4 h-4" />}>
              Back to Clinic Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
}
