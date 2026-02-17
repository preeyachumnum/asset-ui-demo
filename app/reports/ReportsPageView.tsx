"use client";

import { useMemo, useState } from "react";

import { PageTitle } from "@/components/page-title";
import { StatusChip } from "@/components/status-chip";
import { formatDate, formatMoney } from "@/lib/format";
import { listMockSapMismatch } from "@/lib/mock-assets-service";
import { getMockManagementTrackingRows, rowsToCsv } from "@/lib/mock-report-service";
import {
  getMockStocktakeReport,
  getMockStocktakeThreeTabs,
} from "@/lib/mock-stocktake-service";
import { listMockTransferDetails } from "@/lib/mock-transfer-service";

function downloadCsv(fileName: string, csvText: string) {
  const blob = new Blob([csvText], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ReportsPageView() {
  const currentYear = new Date().getFullYear();
  const [plantId, setPlantId] = useState("Plant-KLS");
  const [stocktakeYear, setStocktakeYear] = useState(currentYear);
  const [statusCode, setStatusCode] = useState("ALL");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [costCenterKeyword, setCostCenterKeyword] = useState("");
  const [assetGroupKeyword, setAssetGroupKeyword] = useState("");
  const [locationKeyword, setLocationKeyword] = useState("");
  const [month, setMonth] = useState<number | "">("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const report = useMemo(
    () =>
      getMockStocktakeReport({
        PlantId: plantId,
        StocktakeYear: stocktakeYear,
        StatusCode: statusCode,
        SearchKeyword: searchKeyword,
        CostCenterKeyword: costCenterKeyword,
        AssetGroupKeyword: assetGroupKeyword,
        LocationKeyword: locationKeyword,
        Month: month || undefined,
        DateFrom: dateFrom || undefined,
        DateTo: dateTo || undefined,
      }),
    [
      plantId,
      stocktakeYear,
      statusCode,
      searchKeyword,
      costCenterKeyword,
      assetGroupKeyword,
      locationKeyword,
      month,
      dateFrom,
      dateTo,
    ],
  );

  const tabs = useMemo(
    () => getMockStocktakeThreeTabs(plantId, stocktakeYear),
    [plantId, stocktakeYear],
  );
  const managementRows = getMockManagementTrackingRows();
  const transferHistory = useMemo(() => listMockTransferDetails(), []);
  const sapMismatchRows = useMemo(() => listMockSapMismatch(), []);

  const totalBookValue = useMemo(
    () => report.details.reduce((sum, row) => sum + Number(row.BookValue || 0), 0),
    [report.details],
  );

  return (
    <>
      <PageTitle
        title="รายงาน"
        subtitle="สรุปผลตรวจนับ, รายละเอียด, เปรียบเทียบรายปี และติดตามสถานะงาน"
      />

      <section className="panel">
        <div className="form-grid">
          <div className="field">
            <label>Plant</label>
            <input value={plantId} onChange={(e) => setPlantId(e.target.value)} />
          </div>
          <div className="field">
            <label>Year</label>
            <input type="number" value={stocktakeYear} onChange={(e) => setStocktakeYear(Number(e.target.value))} />
          </div>
          <div className="field">
            <label>Status</label>
            <select value={statusCode} onChange={(e) => setStatusCode(e.target.value)}>
              <option value="ALL">ALL</option>
              <option value="COUNTED">COUNTED</option>
              <option value="NOT_COUNTED">NOT_COUNTED</option>
              <option value="PENDING">PENDING</option>
              <option value="REJECTED">REJECTED</option>
              <option value="OTHER">OTHER</option>
            </select>
          </div>
          <div className="field">
            <label>Search</label>
            <input value={searchKeyword} onChange={(e) => setSearchKeyword(e.target.value)} />
          </div>
          <div className="field">
            <label>Cost Center</label>
            <input value={costCenterKeyword} onChange={(e) => setCostCenterKeyword(e.target.value)} />
          </div>
          <div className="field">
            <label>Asset Group</label>
            <input value={assetGroupKeyword} onChange={(e) => setAssetGroupKeyword(e.target.value)} />
          </div>
          <div className="field">
            <label>Location</label>
            <input value={locationKeyword} onChange={(e) => setLocationKeyword(e.target.value)} />
          </div>
          <div className="field">
            <label>Month</label>
            <input
              type="number"
              min={1}
              max={12}
              value={month}
              onChange={(e) => setMonth(e.target.value ? Number(e.target.value) : "")}
            />
          </div>
          <div className="field">
            <label>Date From</label>
            <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="field">
            <label>Date To</label>
            <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
        </div>
        <div className="chip-list mt-3">
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              downloadCsv(
                `stocktake-detail-${stocktakeYear}.csv`,
                rowsToCsv(
                  report.details.map((row) => ({
                    AssetNo: row.AssetNo,
                    AssetName: row.AssetName,
                    BookValue: row.BookValue,
                    StatusCode: row.StatusCode,
                    AccountingStatus: row.AccountingStatusCode || "",
                    CountMethod: row.CountMethod,
                    CountedQty: row.CountedQty,
                    CountedBy: row.CountedByName,
                    CountedAt: row.CountedAt,
                    Note: row.NoteText || "",
                  })),
                ),
              )
            }
          >
            Export Detail CSV
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              downloadCsv(
                `stocktake-tab-counted-${stocktakeYear}.csv`,
                rowsToCsv(
                  tabs.counted.map((row) => ({
                    AssetNo: row.AssetNo,
                    AssetName: row.AssetName,
                    CostCenter: row.CostCenterName,
                    StatusCode: row.StatusCode,
                    CountedBy: row.CountedByName,
                    CountedAt: row.CountedAt || "",
                  })),
                ),
              )
            }
          >
            Export Tab: Counted
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              downloadCsv(
                `stocktake-tab-not-counted-${stocktakeYear}.csv`,
                rowsToCsv(
                  tabs.notCounted.map((row) => ({
                    AssetNo: row.AssetNo,
                    AssetName: row.AssetName,
                    CostCenter: row.CostCenterName,
                    StatusCode: row.StatusCode,
                    CountedBy: row.CountedByName,
                    CountedAt: row.CountedAt || "",
                  })),
                ),
              )
            }
          >
            Export Tab: Not Counted
          </button>
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              downloadCsv(
                `stocktake-tab-pending-${stocktakeYear}.csv`,
                rowsToCsv(
                  tabs.rejected.map((row) => ({
                    AssetNo: row.AssetNo,
                    AssetName: row.AssetName,
                    CostCenter: row.CostCenterName,
                    StatusCode: row.StatusCode,
                    CountedBy: row.CountedByName,
                    CountedAt: row.CountedAt || "",
                  })),
                ),
              )
            }
          >
            Export Tab: Pending/Rejected
          </button>
        </div>
      </section>

      <section className="panel">
        <div className="kpi-grid">
          <div className="kpi">
            <h3>Detail Rows</h3>
            <p>{report.details.length}</p>
          </div>
          <div className="kpi">
            <h3>Summary Buckets</h3>
            <p>{report.summary.length}</p>
          </div>
          <div className="kpi">
            <h3>Previous Year</h3>
            <p>{report.previousYear}</p>
          </div>
          <div className="kpi">
            <h3>Book Value Total</h3>
            <p>{formatMoney(totalBookValue)}</p>
          </div>
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-2.5">Stocktake Summary</h3>
        <div className="chip-list">
          {report.summary.map((row) => (
            <span className="chip" key={row.StatusCode}>
              {row.StatusCode}: {row.ItemCount}
            </span>
          ))}
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-2.5">Stocktake Detail</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Status</th>
                <th>Method</th>
                <th>Qty</th>
                <th>Book Value</th>
                <th>Counted By</th>
                <th>Counted At</th>
                <th>CostCenter/Location</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {report.details.map((row) => (
                <tr key={row.StocktakeRecordId}>
                  <td>
                    {row.AssetNo} - {row.AssetName}
                    <p className="muted">{row.AssetGroupName}</p>
                  </td>
                  <td>
                    <StatusChip status={row.StatusCode} />
                  </td>
                  <td>{row.CountMethod}</td>
                  <td>{row.CountedQty}</td>
                  <td>{formatMoney(row.BookValue)}</td>
                  <td>{row.CountedByName}</td>
                  <td>{formatDate(row.CountedAt)}</td>
                  <td>
                    {row.CostCenterName} / {row.LocationName}
                  </td>
                  <td>{row.NoteText || "-"}</td>
                </tr>
              ))}
              {!report.details.length ? (
                <tr>
                  <td colSpan={9}>No report rows.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-2.5">
          Compare Year ({stocktakeYear} vs {report.previousYear})
        </h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Asset</th>
                <th>Current Year</th>
                <th>Previous Year</th>
                <th>Note</th>
              </tr>
            </thead>
            <tbody>
              {report.compareRows.map((row) => (
                <tr key={`${row.AssetNo}-${row.CurrentYearStatus}`}>
                  <td>
                    {row.AssetNo} - {row.AssetName}
                  </td>
                  <td>
                    <StatusChip status={row.CurrentYearStatus} />
                  </td>
                  <td>{row.PreviousYearStatus}</td>
                  <td>{row.NoteText}</td>
                </tr>
              ))}
              {!report.compareRows.length ? (
                <tr>
                  <td colSpan={4}>No compare rows.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-2.5">Management Tracking (Demolish/Transfer)</h3>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Type</th>
                <th>Request No</th>
                <th>Status</th>
                <th>Current Approver</th>
                <th>Book Value</th>
                <th>Items</th>
                <th>Receiver</th>
                <th>Approval Trail</th>
                <th>Created By</th>
                <th>Created At</th>
              </tr>
            </thead>
            <tbody>
              {managementRows.map((row) => (
                <tr key={`${row.Type}-${row.RequestNo}`}>
                  <td>{row.Type}</td>
                  <td>{row.RequestNo}</td>
                  <td>
                    <StatusChip status={row.Status} />
                  </td>
                  <td>{row.CurrentApprover}</td>
                  <td>{formatMoney(row.TotalBookValue)}</td>
                  <td>{row.ItemCount}</td>
                  <td>{row.Receiver}</td>
                  <td>{row.ApproverTrail}</td>
                  <td>{row.CreatedByName}</td>
                  <td>{formatDate(row.CreatedAt)}</td>
                </tr>
              ))}
              {!managementRows.length ? (
                <tr>
                  <td colSpan={10}>No management tracking rows.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-2.5">Transfer History Report (ประวัติการโอนย้าย)</h3>
        <p className="muted mb-2 text-xs">
          ตรวจสอบย้อนหลังว่าทรัพย์สินอยู่ที่ไหน ใครเป็นผู้รับโอน และโอนเมื่อใด
        </p>
        <div className="chip-list mb-2.5">
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              downloadCsv(
                `transfer-history-${stocktakeYear}.csv`,
                rowsToCsv(
                  transferHistory.flatMap((tr) =>
                    tr.Items.map((item) => ({
                      RequestNo: tr.RequestNo,
                      Status: tr.Status,
                      AssetNo: item.AssetNo,
                      AssetName: item.AssetName,
                      BookValue: item.BookValueAtRequest,
                      FromCostCenter: tr.FromCostCenter,
                      ToCostCenter: tr.ToCostCenter,
                      ToLocation: tr.ToLocation,
                      ReceiverName: tr.ToOwnerName,
                      ReceiverEmail: tr.ToOwnerEmail,
                      Reason: tr.ReasonText,
                      CreatedBy: tr.CreatedByName,
                      CreatedAt: tr.CreatedAt,
                    })),
                  ),
                ),
              )
            }
          >
            Export Transfer History CSV
          </button>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Request No</th>
                <th>Status</th>
                <th>Asset</th>
                <th>Book Value</th>
                <th>From → To</th>
                <th>Location</th>
                <th>Receiver</th>
                <th>Reason</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              {transferHistory.flatMap((tr) =>
                tr.Items.map((item) => (
                  <tr key={`${tr.TransferRequestId}-${item.TransferRequestItemId}`}>
                    <td>{tr.RequestNo}</td>
                    <td>
                      <StatusChip status={tr.Status} />
                    </td>
                    <td>
                      {item.AssetNo} - {item.AssetName}
                    </td>
                    <td>{formatMoney(item.BookValueAtRequest)}</td>
                    <td>
                      {tr.FromCostCenter} → {tr.ToCostCenter}
                    </td>
                    <td>{tr.ToLocation}</td>
                    <td>
                      {tr.ToOwnerName}
                      <p className="muted">{tr.ToOwnerEmail}</p>
                    </td>
                    <td>{tr.ReasonText || "-"}</td>
                    <td>{formatDate(tr.CreatedAt)}</td>
                  </tr>
                )),
              )}
              {!transferHistory.length ? (
                <tr>
                  <td colSpan={9}>No transfer history.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>

      <section className="panel">
        <h3 className="mb-2.5">Data Variance Report (ข้อมูล SAP ไม่ตรงระบบ)</h3>
        <p className="muted mb-2 text-xs">
          แสดงรายการที่ข้อมูลหน้างานไม่ตรงกับระบบ SAP หรือรายการที่หายไป
        </p>
        <div className="chip-list mb-2.5">
          <button
            className="button button--ghost"
            type="button"
            onClick={() =>
              downloadCsv(
                `sap-variance-${stocktakeYear}.csv`,
                rowsToCsv(
                  sapMismatchRows.map((row) => ({
                    AssetNo: row.AssetNo,
                    AssetName: row.AssetName || "",
                    MismatchType: row.MismatchType,
                    AssetBookValue: row.AssetBookValue ?? "",
                    SapBookValue: row.SapBookValue ?? "",
                    AssetPlant: row.AssetPlantCode || "",
                    SapPlant: row.SapPlantCode || "",
                    AssetCostCenter: row.AssetCostCenterCode || "",
                    SapCostCenter: row.SapCostCenterCode || "",
                    SapLastSeen: row.SapLastSeenAt || "",
                  })),
                ),
              )
            }
          >
            Export SAP Variance CSV
          </button>
        </div>
        <div className="kpi-grid mb-2.5">
          <div className="kpi">
            <h3>Total Mismatch</h3>
            <p>{sapMismatchRows.length}</p>
          </div>
          <div className="kpi">
            <h3>Missing in SAP</h3>
            <p>{sapMismatchRows.filter((x) => x.MismatchType === "MISSING_IN_SAP").length}</p>
          </div>
          <div className="kpi">
            <h3>Book Value Mismatch</h3>
            <p>{sapMismatchRows.filter((x) => x.MismatchType === "BOOKVALUE_MISMATCH").length}</p>
          </div>
          <div className="kpi">
            <h3>Other Mismatch</h3>
            <p>
              {sapMismatchRows.filter((x) => !["MISSING_IN_SAP", "BOOKVALUE_MISMATCH"].includes(x.MismatchType)).length}
            </p>
          </div>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Asset No</th>
                <th>Asset Name</th>
                <th>Mismatch Type</th>
                <th>eAsset BV</th>
                <th>SAP BV</th>
                <th>eAsset Plant</th>
                <th>SAP Plant</th>
                <th>eAsset CCA</th>
                <th>SAP CCA</th>
                <th>SAP Last Seen</th>
              </tr>
            </thead>
            <tbody>
              {sapMismatchRows.map((row) => (
                <tr key={`${row.AssetNo}-${row.MismatchType}`}>
                  <td>{row.AssetNo}</td>
                  <td>{row.AssetName || "-"}</td>
                  <td>
                    <StatusChip status={row.MismatchType} />
                  </td>
                  <td>{row.AssetBookValue != null ? formatMoney(row.AssetBookValue) : "-"}</td>
                  <td>{row.SapBookValue != null ? formatMoney(row.SapBookValue) : "-"}</td>
                  <td>{row.AssetPlantCode || "-"}</td>
                  <td>{row.SapPlantCode || "-"}</td>
                  <td>{row.AssetCostCenterCode || "-"}</td>
                  <td>{row.SapCostCenterCode || "-"}</td>
                  <td>{formatDate(row.SapLastSeenAt)}</td>
                </tr>
              ))}
              {!sapMismatchRows.length ? (
                <tr>
                  <td colSpan={10}>No SAP variance detected.</td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
