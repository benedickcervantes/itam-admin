import { Suspense } from "react";
import { Header } from "@/components/Header";
import { TableSkeleton } from "@/components/TableSkeleton";
import { SoftwarePage } from "./software-page";

function SoftwarePageFallback() {
  return (
    <>
      <Header
        title="Software"
        subtitle="Company software catalog and the checklist on each PC and laptop"
      />
      <div className="page-content flex-1 overflow-y-auto">
        <div className="card overflow-hidden">
          <div className="table-scroll">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Computer</th>
                  <th>User</th>
                  <th>Department</th>
                  <th>Standard</th>
                  <th style={{ textAlign: "right" }}>Extras</th>
                  <th>Compliance</th>
                </tr>
              </thead>
              <tbody>
                <TableSkeleton columns={6} />
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<SoftwarePageFallback />}>
      <SoftwarePage />
    </Suspense>
  );
}
