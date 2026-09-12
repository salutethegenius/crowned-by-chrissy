"use client";

import { useState } from "react";
import { Button } from "./Button";
import { simulateDemoPay } from "@/app/demo/pay/actions";

export function DemoPayButton({ orderNumber }: { orderNumber: string }) {
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="mt-8">
      <Button
        variant="lilac"
        className="w-full"
        onClick={async () => {
          const result = await simulateDemoPay(orderNumber);
          if (result?.error) setErr(result.error);
        }}
      >
        Simulate successful payment
      </Button>
      {err ? <p className="mt-3 text-plum">{err}</p> : null}
    </div>
  );
}
