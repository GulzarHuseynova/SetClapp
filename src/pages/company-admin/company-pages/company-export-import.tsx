import { useMemo, useState } from 'react';
import { Select, Upload } from 'antd';
import { message } from '../../../utils/antd-static';
import {
  DownloadOutlined,
  FileExcelOutlined,
  FileOutlined,
  GlobalOutlined,
  UploadOutlined,
} from '@ant-design/icons';
import { AppButton } from '../../../components/ui/app-button';
import { useCompanyAdmin } from '../../../hooks/use-company-admin';
import { exportImportActions } from '../../../helpers/export-import.helper';
import { buildSwaggerExportCsv, buildTemplateCsv, isSuperAdminRow, parseEmployeesCsv, validateImportedEmployee } from '../../../features/company-admin/business-card';
import type { ExportImportLoadingAction } from '../../../types/export-import.type';
import { downloadTextFile } from '../../../utils/download.utils';

const { Dragger } = Upload;

export default function CompanyExportImport() {
  const {
    company,
    usersList,
    activeCompanyId,
    addUser,
    fetchUsers,
    isLimitReached,
  } = useCompanyAdmin();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedHtmlIds, setSelectedHtmlIds] = useState<string[]>([]);
  const [loading, setLoading] = useState<ExportImportLoadingAction>(null);

  const companyUsers = useMemo(
    () => usersList.filter((user) => !isSuperAdminRow(user)),
    [usersList],
  );

  const exportableUsers = useMemo(
    () => companyUsers.filter((user) => Boolean(String(user.id || '').trim())),
    [companyUsers],
  );

  const employeeOptions = useMemo(
    () => exportableUsers.map((user) => ({
      value: String(user.id),
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}${user.jobTitle ? ` — ${user.jobTitle}` : ''}`,
    })),
    [exportableUsers],
  );

  const htmlEmployees = useMemo(
    () => exportableUsers.filter((user) => {
      const role = String(user.role ?? '').trim().toLowerCase();
      return role !== '1' && role !== 'company-admin' && role !== 'companyadmin';
    }),
    [exportableUsers],
  );

  const htmlEmployeeOptions = useMemo(
    () => htmlEmployees.map((user) => ({
      value: String(user.id),
      label: `${`${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email}${user.jobTitle ? ` — ${user.jobTitle}` : ''}`,
    })),
    [htmlEmployees],
  );

  const handleExportAllExcel = async () => {
    if (!activeCompanyId) {
      message.error('Şirkət ID tapılmadı.');
      return;
    }

    setLoading('all-excel');
    try {
      await exportImportActions.exportExcel(activeCompanyId);
      message.success('Bütün əməkdaşlar Excel (.xlsx) kimi yükləndi.');
    } catch {
      downloadTextFile(
        buildSwaggerExportCsv(companyUsers, company.name),
        `employees-${activeCompanyId || 'company'}.csv`,
      );
      message.warning('Excel endpointi fayl qaytarmadı, ehtiyat CSV yaradıldı.');
    } finally {
      setLoading(null);
    }
  };

  const handleExportSelectedExcel = async () => {
    if (selectedIds.length === 0) {
      message.warning('Əvvəlcə siyahıdan əməkdaş seçin.');
      return;
    }

    setLoading('selected-excel');
    try {
      await exportImportActions.exportSelectedExcel(selectedIds);
      message.success('Seçilmiş əməkdaşlar Excel (.xlsx) kimi yükləndi.');
    } catch {
      const selectedUsers = companyUsers.filter((user) => selectedIds.includes(String(user.id)));
      downloadTextFile(
        buildSwaggerExportCsv(selectedUsers, company.name),
        `selected-users-${activeCompanyId || 'company'}.csv`,
      );
      message.warning('Seçilmiş Excel yüklənmədi, ehtiyat CSV yaradıldı.');
    } finally {
      setLoading(null);
    }
  };

  const handleDownloadTemplate = async () => {
    setLoading('template');
    try {
      await exportImportActions.downloadTemplate();
      message.success('Excel şablonu yükləndi.');
    } catch {
      downloadTextFile(buildTemplateCsv(), 'employees-template.csv');
      message.warning('Backend şablonu yüklənmədi, ehtiyat CSV şablonu yaradıldı.');
    } finally {
      setLoading(null);
    }
  };

  const handleImport = async (file: File) => {
    if (!activeCompanyId) {
      message.error('Şirkət ID tapılmadı.');
      return false;
    }

    if (isLimitReached) {
      message.error(`Əməkdaş limiti dolub. Maksimum ${company.employeeLimit} əməkdaş ola bilər.`);
      return false;
    }

    setLoading('import');
    try {
      const isCsv = file.name.toLowerCase().endsWith('.csv') || file.type.includes('csv') || file.type.includes('text');

      if (!isCsv) {
        await exportImportActions.importExcel(activeCompanyId, file);
        await fetchUsers(activeCompanyId);
        message.success('Excel faylı uğurla idxal edildi.');
        return false;
      }

      const parsedEmployees = await parseEmployeesCsv(file);
      const rowErrors = parsedEmployees.flatMap((employee, index) => validateImportedEmployee(employee, index + 2));

      if (rowErrors.length > 0) {
        message.error(rowErrors[0]);
        return false;
      }

      let success = 0;
      for (const employee of parsedEmployees) {
        await addUser(employee);
        success += 1;
      }

      await fetchUsers(activeCompanyId);
      message.success(`${success} əməkdaş idxal edildi.`);
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Faylı idxal etmək mümkün olmadı.';
      message.error(text);
    } finally {
      setLoading(null);
    }

    return false;
  };

  const handleExportAllHtml = async () => {
    const allEmployeeIds = htmlEmployees.map((user) => String(user.id || '').trim()).filter(Boolean);
    if (allEmployeeIds.length === 0) {
      message.warning('HTML yükləmək üçün işçi tapılmadı.');
      return;
    }

    setLoading('all-html');
    try {
      await exportImportActions.exportSelectedHtml(allEmployeeIds, htmlEmployees);
      message.success('Bütün işçilərin offline HTML faylları yükləndi.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'İşçilərin HTML fayllarını yükləmək mümkün olmadı.';
      message.error(text);
    } finally {
      setLoading(null);
    }
  };

  const handleExportSelectedHtml = async () => {
    if (selectedHtmlIds.length === 0) {
      message.warning('Əvvəlcə HTML üçün işçi seçin.');
      return;
    }

    const selectedEmployees = htmlEmployees.filter((user) => selectedHtmlIds.includes(String(user.id)));
    setLoading('selected-html');
    try {
      await exportImportActions.exportSelectedHtml(selectedHtmlIds, selectedEmployees);
      message.success('Seçilmiş işçilərin offline HTML faylları yükləndi.');
    } catch (error) {
      const text = error instanceof Error ? error.message : 'Seçilmiş HTML fayllarını yükləmək mümkün olmadı.';
      message.error(text);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="ca-reference-page ca-export-import-page">
      <section className="ca-reference-card ca-export-card">
        <div className="ca-card-title-row">
          <span className="ca-card-icon ca-card-icon-blue"><FileOutlined /></span>
          <strong>Excel ixrac</strong>
        </div>
        <p>Ad, vəzifə, əlaqə və vizitkart linki .xlsx faylına yazılır.</p>

        <AppButton
          type="primary"
          className="ca-primary-action force-navy-action"
          block
          icon={<FileExcelOutlined />}
          loading={loading === 'all-excel'}
          onClick={() => void handleExportAllExcel()}
        >
          Bütün əməkdaşları yüklə
        </AppButton>

        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="Seçilmiş əməkdaşlar"
          value={selectedIds}
          options={employeeOptions}
          onChange={(values) => setSelectedIds(values.map(String))}
          className="w-full"
        />

        <AppButton
          type="primary"
          block
          className="ca-primary-action force-navy-action"
          icon={<DownloadOutlined />}
          disabled={selectedIds.length === 0}
          loading={loading === 'selected-excel'}
          onClick={() => void handleExportSelectedExcel()}
        >
          Seçilmişləri yüklə
        </AppButton>
        <small>Əvvəlcə siyahıdan əməkdaş seçin.</small>
      </section>

      <section className="ca-reference-card ca-import-card">
        <div className="ca-card-title-row">
          <span className="ca-card-icon ca-card-icon-warm"><UploadOutlined /></span>
          <strong>Excel idxal</strong>
        </div>
        <p>Şablonu yükləyin, doldurun və geri göndərin.</p>

        <AppButton
          type="primary"
          className="ca-primary-action force-navy-action"
          block
          icon={<DownloadOutlined />}
          loading={loading === 'template'}
          onClick={() => void handleDownloadTemplate()}
        >
          Şablonu yüklə
        </AppButton>

        <Dragger
          className="ca-import-dragger"
          accept=".xlsx,.xls,.csv"
          multiple={false}
          showUploadList={false}
          disabled={loading === 'import'}
          beforeUpload={(file) => handleImport(file)}
        >
          <div className="ca-dragger-copy">
            <strong>{loading === 'import' ? 'Fayl göndərilir...' : 'Faylı bura atın'}</strong>
            <span>və ya <u>seçin</u> · yalnız .xlsx</span>
          </div>
        </Dragger>
      </section>

      <section className="ca-reference-card ca-html-card">
        <div className="ca-card-title-row">
          <span className="ca-card-icon ca-card-icon-blue"><GlobalOutlined /></span>
          <strong>Offline HTML</strong>
        </div>
        <p>CompanyAdmin yox, işçilərin internetsiz açılan vizitkart HTML fayllarını yükləyin.</p>

        <AppButton
          type="primary"
          className="ca-primary-action force-navy-action"
          block
          icon={<DownloadOutlined />}
          disabled={htmlEmployees.length === 0}
          loading={loading === 'all-html'}
          onClick={() => void handleExportAllHtml()}
        >
          Bütün işçiləri yüklə
        </AppButton>

        <Select
          mode="multiple"
          allowClear
          maxTagCount="responsive"
          placeholder="HTML üçün işçi seçin"
          value={selectedHtmlIds}
          options={htmlEmployeeOptions}
          onChange={(values) => setSelectedHtmlIds(values.map(String))}
          className="w-full"
        />

        <AppButton
          type="primary"
          block
          className="ca-primary-action force-navy-action"
          icon={<DownloadOutlined />}
          disabled={selectedHtmlIds.length === 0}
          loading={loading === 'selected-html'}
          onClick={() => void handleExportSelectedHtml()}
        >
          Seçilmiş işçiləri yüklə
        </AppButton>
        <small>Bir işçi seçildikdə .html, bir neçə işçi seçildikdə ZIP yüklənir.</small>
      </section>
    </div>
  );
}
