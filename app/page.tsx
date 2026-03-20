"use client";
import FrontEnd from "@/components/ui/FrontEnd";

export default function Page() {
  try {
    return <FrontEnd />;
  } catch (error: any) {
    return (
      <div>
        <h1>An error occurred during rendering:</h1>
        <pre>{error.message}</pre>
      </div>
    );
  }
}
