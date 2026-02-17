import { assetStatusMaster, mockAssets, mockAssetsNoImage } from "@/lib/mock-data";
import type { AssetImage, AssetSapMismatchRow, AssetView, PagedRows, PagingMeta } from "@/lib/types";
import { nowIso, readLocalState, uid, writeLocalState } from "@/lib/mock-utils";

type AssetStore = {
  assets: AssetView[];
  images: Record<string, AssetImage[]>;
};

const KEY = "asset_frontend_mock_assets_v1";

function makeImageUrl(seed: string) {
  return `https://picsum.photos/seed/${encodeURIComponent(seed)}/1000/600`;
}

function seedAssetsStore(): AssetStore {
  const assets: AssetView[] = [
    ...mockAssets.map((asset, index) => ({
      ...asset,
      HasImage: !mockAssetsNoImage.some((x) => x.AssetId === asset.AssetId),
      SapExists: index % 3 !== 0,
      SapBookValue: Math.max(0, asset.BookValue + (index % 2 === 0 ? 150 : -120)),
      SapAssetNo: `SAP-${asset.AssetNo}`,
      AssetGroupName: ["Machinery", "Vehicle", "Building", "IT", "Furniture"][index % 5],
      Quantity: index % 2 === 0 ? 1 : 2,
      LastCountStatusCode: index % 2 === 0 ? "COUNTED" : "PENDING",
      LastCountedAt: index % 2 === 0 ? new Date(Date.now() - index * 86400000).toISOString() : undefined,
    })),
    {
      AssetId: uid(),
      AssetNo: "700-009-2024",
      AssetName: "Steam Pipe Monitor",
      BookValue: 72100,
      ReceiveDate: "2024-05-16",
      QrTypeCode: "STICKER",
      StatusName: assetStatusMaster[0],
      PlantName: "Plant-KLS",
      CostCenterName: "CCA-4100",
      LocationName: "PIPELINE-04",
      HasImage: true,
      SapExists: true,
      SapBookValue: 72100,
      SapAssetNo: "SAP-700-009-2024",
      AssetGroupName: "Machinery",
      Quantity: 1,
      LastCountStatusCode: "COUNTED",
      LastCountedAt: new Date().toISOString(),
    },
  ];

  const images: Record<string, AssetImage[]> = {};
  for (const asset of assets) {
    images[asset.AssetId] = asset.HasImage
      ? [
          {
            AssetImageId: uid(),
            AssetId: asset.AssetId,
            FileUrl: makeImageUrl(asset.AssetNo),
            IsPrimary: true,
            SortOrder: 1,
            UploadedAt: nowIso(),
          },
        ]
      : [];
  }

  return { assets, images };
}

function readStore() {
  return readLocalState<AssetStore>(KEY, seedAssetsStore());
}

function saveStore(store: AssetStore) {
  writeLocalState(KEY, store);
}

export function listMockAssets(params?: {
  mode?: "all" | "no-image" | "sap-gap";
  search?: string;
}) {
  const store = readStore();
  const mode = params?.mode || "all";
  const search = (params?.search || "").trim().toLowerCase();

  let rows = [...store.assets];
  if (mode === "no-image") rows = rows.filter((x) => !x.HasImage);
  if (mode === "sap-gap") {
    rows = rows.filter((x) => !x.SapExists || Math.abs(x.BookValue - x.SapBookValue) > 0.01);
  }
  if (search) {
    rows = rows.filter((x) =>
      [
        x.AssetNo,
        x.AssetName,
        x.StatusName,
        x.PlantName,
        x.CostCenterName,
        x.LocationName,
        x.AssetGroupName,
      ]
        .join(" ")
        .toLowerCase()
        .includes(search),
    );
  }
  rows.sort((a, b) => (a.AssetNo > b.AssetNo ? 1 : -1));
  return rows;
}

export function getMockAssetMetrics() {
  const store = readStore();
  return {
    total: store.assets.length,
    noImage: store.assets.filter((x) => !x.HasImage).length,
    sapGap: store.assets.filter((x) => !x.SapExists || Math.abs(x.BookValue - x.SapBookValue) > 0.01).length,
  };
}

export function getMockAssetDetail(assetId: string) {
  const store = readStore();
  return {
    asset: store.assets.find((x) => x.AssetId === assetId) || null,
    images: store.images[assetId] || [],
  };
}

export function getMockAssetOptions() {
  const store = readStore();
  return store.assets.map((x) => ({
    AssetId: x.AssetId,
    AssetNo: x.AssetNo,
    AssetName: x.AssetName,
    CostCenterName: x.CostCenterName || "",
    BookValue: x.BookValue,
  }));
}

export function getMockAssetStatusOptions() {
  return [...assetStatusMaster];
}

export function addMockAssetImageFiles(assetId: string, fileNames: string[]) {
  const store = readStore();
  const asset = store.assets.find((x) => x.AssetId === assetId);
  if (!asset) throw new Error("Asset not found");

  const incoming = fileNames.filter(Boolean);
  const list = store.images[assetId] || [];
  incoming.forEach((name, idx) => {
    list.push({
      AssetImageId: uid(),
      AssetId: assetId,
      FileUrl: makeImageUrl(`${asset.AssetNo}-${name}-${idx}`),
      IsPrimary: list.length === 0 && idx === 0,
      SortOrder: list.length + idx + 1,
      UploadedAt: nowIso(),
    });
  });

  store.images[assetId] = list;
  asset.HasImage = list.length > 0;
  asset.UpdatedAt = nowIso();
  saveStore(store);
  return list;
}

export function updateMockAssetFields(
  assetId: string,
  patch: Partial<Pick<AssetView, "StatusName" | "LocationName" | "CostCenterName" | "AssetGroupName">>,
) {
  const store = readStore();
  const asset = store.assets.find((x) => x.AssetId === assetId);
  if (!asset) throw new Error("Asset not found");
  Object.assign(asset, patch);
  asset.UpdatedAt = nowIso();
  saveStore(store);
  return asset;
}

export function resetMockAssetsStore() {
  saveStore(seedAssetsStore());
}

/* ---------- SAP Mismatch (เลียนแบบ /assets/sap-mismatch) ---------- */

export function listMockSapMismatch(search?: string): AssetSapMismatchRow[] {
  const store = readStore();
  const keyword = (search || "").trim().toLowerCase();

  const mismatchRows: AssetSapMismatchRow[] = store.assets
    .filter((x) => !x.SapExists || Math.abs(x.BookValue - x.SapBookValue) > 0.01)
    .map((x) => ({
      AssetNo: x.AssetNo,
      AssetId: x.AssetId,
      AssetName: x.AssetName,
      SapAssetName: x.SapExists ? `SAP-${x.AssetName}` : null,
      AssetBookValue: x.BookValue,
      SapBookValue: x.SapExists ? x.SapBookValue : null,
      AssetCompanyCode: "MITRPHOL",
      SapCompanyCode: x.SapExists ? "MITRPHOL" : null,
      AssetPlantCode: x.PlantName || null,
      SapPlantCode: x.SapExists ? x.PlantName || null : null,
      AssetCostCenterCode: x.CostCenterName || null,
      SapCostCenterCode: x.SapExists ? x.CostCenterName || null : null,
      SapLastSeenAt: x.SapExists ? nowIso() : null,
      MismatchType: !x.SapExists
        ? "MISSING_IN_SAP"
        : Math.abs(x.BookValue - x.SapBookValue) > 0.01
          ? "BOOKVALUE_MISMATCH"
          : "PLANT_MISMATCH",
    }));

  if (!keyword) return mismatchRows;

  return mismatchRows.filter((x) =>
    [x.AssetNo, x.AssetName, x.SapAssetName, x.AssetPlantCode, x.AssetCostCenterCode]
      .join(" ")
      .toLowerCase()
      .includes(keyword),
  );
}

/* ---------- Pagination (เลียนแบบ toPagedResult ของ API) ---------- */

export function paginateMockRows<T>(
  allRows: T[],
  page: number,
  pageSize: number,
): PagedRows<T> {
  const safePage = Math.max(1, page);
  const safeSize = Math.max(1, Math.min(pageSize, 500));
  const totalRows = allRows.length;
  const totalPages = totalRows > 0 ? Math.ceil(totalRows / safeSize) : 0;
  const start = (safePage - 1) * safeSize;
  const rows = allRows.slice(start, start + safeSize);

  return {
    rows,
    paging: {
      page: safePage,
      pageSize: safeSize,
      totalRows,
      totalPages,
    },
  };
}

/* ---------- File URL (เลียนแบบ toApiFileUrl) ---------- */

export function mockToApiFileUrl(fileUrl: string): string {
  const s = String(fileUrl || "").trim();
  if (!s) return "";
  if (/^https?:\/\//i.test(s)) return s;
  return `https://picsum.photos/seed/${encodeURIComponent(s)}/1000/600`;
}
