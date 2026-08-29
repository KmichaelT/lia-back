import { Button, Typography } from '@strapi/design-system';
import { useFetchClient, useNotification, useQueryParams } from '@strapi/strapi/admin';
import type { ListFieldLayout, ListLayout } from '@strapi/content-manager/strapi-admin';
import type { Modules } from '@strapi/types';
import { useParams } from 'react-router-dom';
import { stringify } from 'qs';
import * as XLSX from 'xlsx';

const CHILD_UID = 'api::child.child';

type ChildDocument = Modules.Documents.AnyDocument & {
  liaId?: string;
  fullName?: string;
  dateOfBirth?: string;
  currentGrade?: string;
  school?: string;
  location?: string;
  aspiration?: string;
  imageCount?: number;
  videoCount?: number;
  publishedAt?: string | null;
};

type ColumnHookArgs = {
  layout: ListLayout;
  displayedHeaders: ListFieldLayout[];
};

const CountCell = ({ value }: { value: unknown }) => (
  <Typography textColor="neutral800">{Number(value ?? 0)}</Typography>
);

export const addChildMediaCountColumns = ({ layout, displayedHeaders }: ColumnHookArgs) => {
  // Strapi's ListLayout does not expose the content-type UID to this hook.
  // Identify Child by its schema display name and its distinctive fields.
  const fieldNames = new Set(Object.keys(layout.metadatas ?? {}));
  const isChildLayout =
    layout.settings.displayName === 'Child' &&
    fieldNames.has('liaId') &&
    fieldNames.has('images');

  if (!isChildLayout) {
    return { layout, displayedHeaders };
  }

  return {
    layout,
    displayedHeaders: [
      ...displayedHeaders,
      {
        name: 'imageCount',
        label: { id: 'lia.child.image-count', defaultMessage: 'Images' },
        searchable: false,
        sortable: true,
        cellFormatter: (document: ChildDocument) => <CountCell value={document.imageCount} />,
      },
      {
        name: 'videoCount',
        label: { id: 'lia.child.video-count', defaultMessage: 'Videos' },
        searchable: false,
        sortable: true,
        cellFormatter: (document: ChildDocument) => <CountCell value={document.videoCount} />,
      },
    ],
  };
};

const downloadExcel = (rows: ChildDocument[]) => {
  const worksheet = XLSX.utils.json_to_sheet(
    rows.map((child) => ({
      'LIA ID': child.liaId ?? '',
      'Full name': child.fullName ?? '',
      'Date of birth': child.dateOfBirth ?? '',
      'Current grade': child.currentGrade ?? '',
      School: child.school ?? '',
      Location: child.location ?? '',
      Aspiration: child.aspiration ?? '',
      Images: child.imageCount ?? 0,
      Videos: child.videoCount ?? 0,
      Status: child.publishedAt ? 'Published' : 'Draft',
    }))
  );

  worksheet['!cols'] = [
    { wch: 14 },
    { wch: 28 },
    { wch: 16 },
    { wch: 18 },
    { wch: 28 },
    { wch: 24 },
    { wch: 30 },
    { wch: 10 },
    { wch: 10 },
    { wch: 12 },
  ];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Children');
  XLSX.writeFile(workbook, `children-${new Date().toISOString().slice(0, 10)}.xlsx`, {
    compression: true,
  });
};

export const ExportChildrenButton = () => {
  const { slug } = useParams<{ slug: string }>();
  const [{ query }] = useQueryParams();
  const { get } = useFetchClient();
  const { toggleNotification } = useNotification();

  if (slug !== CHILD_UID) return null;

  const handleExport = async () => {
    try {
      const pageSize = 100;
      let page = 1;
      let pageCount = 1;
      const children: ChildDocument[] = [];

      do {
        const exportQuery = {
          ...query,
          page,
          pageSize,
        };
        const response = await get(
          `/content-manager/collection-types/${CHILD_UID}?${stringify(exportQuery)}`
        );
        const data = response.data as {
          results?: ChildDocument[];
          pagination?: { pageCount?: number };
        };
        children.push(...(data.results ?? []));
        pageCount = data.pagination?.pageCount ?? 1;
        page += 1;
      } while (page <= pageCount);

      downloadExcel(children);
      toggleNotification({
        type: 'success',
        message: `${children.length} children exported`,
      });
    } catch {
      toggleNotification({
        type: 'danger',
        message: 'Could not export the children. Please try again.',
      });
    }
  };

  return (
    <Button variant="secondary" onClick={handleExport}>
      Export Excel
    </Button>
  );
};
