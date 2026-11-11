import React, { useEffect, useState } from 'react';
import {
  ClipboardList,
  Plus,
  Loader2,
  RefreshCw,
  Eye,
  CheckCircle2,
  BarChart2,
  Trash2,
  GitBranch,
  FileSpreadsheet,
  Download,
  Star,
  MessageSquare,
  Filter,
  MapPin,
  Clock,
  Search,
  ChevronLeft,
  ChevronRight,
  PieChart,
  HelpCircle,
  FileText,
  Building,
  Smartphone,
  Quote,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import {
  SurveyDto,
  SurveyQuestionDto,
  SurveyResponseDto,
  CampaignDto,
  SurveyAnalyticsDto,
  LocationDto,
} from '../../types/models';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';

export const SurveysPage: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyDto[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignDto[]>([]);
  const [locations, setLocations] = useState<LocationDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Survey Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  const [selectedCampaignId, setSelectedCampaignId] = useState<number | undefined>(undefined);
  const [newSurveyQuota, setNewSurveyQuota] = useState(500);
  const [questions, setQuestions] = useState<Array<{
    questionText: string;
    questionType: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT' | 'RATING';
    optionsList: string[];
    required: boolean;
  }>>([
    {
      questionText: 'Quý vị đánh giá chất lượng sóng Wi-Fi tại Nhà văn hóa hôm nay như thế nào?',
      questionType: 'SINGLE_CHOICE',
      optionsList: ['Rất tốt', 'Ổn định', 'Chập chờn', 'Không vào được mạng'],
      required: true,
    },
    {
      questionText: 'Ý kiến đóng góp thêm về tiện ích chuyển đổi số tại địa phương:',
      questionType: 'TEXT',
      optionsList: [],
      required: false,
    },
  ]);

  // View Responses & Analytics Modal State
  const [selectedSurveyForResponses, setSelectedSurveyForResponses] = useState<SurveyDto | null>(null);
  const [activeAnalyticsTab, setActiveAnalyticsTab] = useState<'ANALYTICS' | 'RESPONSES' | 'FEEDBACK'>('ANALYTICS');
  const [analytics, setAnalytics] = useState<SurveyAnalyticsDto | null>(null);
  const [loadingAnalytics, setLoadingAnalytics] = useState(false);

  // Paginated responses state
  const [responses, setResponses] = useState<SurveyResponseDto[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);
  const [responsePage, setResponsePage] = useState(0);
  const [responseTotalPages, setResponseTotalPages] = useState(1);
  const [responseTotalElements, setResponseTotalElements] = useState(0);
  const [filterLocationId, setFilterLocationId] = useState<number | undefined>(undefined);

  // Text feedback search state
  const [feedbackSearch, setFeedbackSearch] = useState('');

  // Export states
  const [exportingExcel, setExportingExcel] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    setLoading(true);
    try {
      const [survResp, campResp, locsResp] = await Promise.all([
        adminApi.getSurveys({ size: 50 }),
        adminApi.getCampaigns({ size: 100 }).catch(() => ({ content: [] })),
        adminApi.getLocations({ size: 100 }).catch(() => ({ content: [] })),
      ]);
      setSurveys(survResp.content);
      setCampaigns(campResp.content);
      setLocations(locsResp.content || []);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bài khảo sát ý kiến.');
    } finally {
      setLoading(false);
    }
  };

  const loadSurveys = async () => {
    try {
      const survResp = await adminApi.getSurveys({ size: 50 });
      setSurveys(survResp.content);
    } catch (err: any) {
      setError(err?.message || 'Không thể làm mới danh sách.');
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        questionType: 'SINGLE_CHOICE',
        optionsList: ['Rất hài lòng', 'Hài lòng', 'Chưa hài lòng'],
        required: true,
      },
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleMoveQuestion = (index: number, direction: 'UP' | 'DOWN') => {
    if ((direction === 'UP' && index === 0) || (direction === 'DOWN' && index === questions.length - 1)) return;
    const targetIdx = direction === 'UP' ? index - 1 : index + 1;
    const updated = [...questions];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;
    setQuestions(updated);
  };

  const handleAddOption = (qIdx: number) => {
    const updated = [...questions];
    const currentList = updated[qIdx].optionsList || [];
    updated[qIdx].optionsList = [...currentList, `Lựa chọn ${currentList.length + 1}`];
    setQuestions(updated);
  };

  const handleUpdateOption = (qIdx: number, optIdx: number, val: string) => {
    const updated = [...questions];
    const list = [...(updated[qIdx].optionsList || [])];
    list[optIdx] = val;
    updated[qIdx].optionsList = list;
    setQuestions(updated);
  };

  const handleRemoveOption = (qIdx: number, optIdx: number) => {
    const updated = [...questions];
    const list = [...(updated[qIdx].optionsList || [])].filter((_, i) => i !== optIdx);
    updated[qIdx].optionsList = list;
    setQuestions(updated);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) return;

    setCreating(true);
    try {
      const payloadQuestions: SurveyQuestionDto[] = questions.map((q, idx) => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        optionsJson:
          q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTI_CHOICE'
            ? JSON.stringify((q.optionsList || []).map((s) => s.trim()).filter(Boolean))
            : undefined,
        sortOrder: idx,
        required: q.required,
      }));

      await adminApi.createSurvey({
        id: 0,
        campaignId: selectedCampaignId,
        title: newSurveyTitle.trim(),
        description: newSurveyDesc.trim() || undefined,
        maxResponsesQuota: Number(newSurveyQuota),
        currentResponsesCount: 0,
        active: true,
        questions: payloadQuestions,
      });

      setIsCreateOpen(false);
      setNewSurveyTitle('');
      setNewSurveyDesc('');
      setSelectedCampaignId(undefined);
      loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo bài khảo sát mới.');
    } finally {
      setCreating(false);
    }
  };

  // Open Feedback & Analytics Center
  const handleOpenAnalytics = async (s: SurveyDto) => {
    setSelectedSurveyForResponses(s);
    setActiveAnalyticsTab('ANALYTICS');
    setFilterLocationId(undefined);
    setResponsePage(0);
    setFeedbackSearch('');

    // Fetch Analytics & Initial Responses in parallel
    setLoadingAnalytics(true);
    setLoadingResponses(true);
    try {
      const [analyticsData, responsesData] = await Promise.all([
        adminApi.getSurveyAnalytics(s.id),
        adminApi.getSurveyResponses(s.id, undefined, 0, 15),
      ]);
      setAnalytics(analyticsData);
      setResponses(responsesData.content);
      setResponseTotalPages(responsesData.totalPages);
      setResponseTotalElements(responsesData.totalElements);
    } catch (err: any) {
      alert(err?.message || 'Không thể tải số liệu phân tích khảo sát.');
    } finally {
      setLoadingAnalytics(false);
      setLoadingResponses(false);
    }
  };

  const loadResponsesWithFilter = async (locId?: number, page = 0) => {
    if (!selectedSurveyForResponses) return;
    setLoadingResponses(true);
    try {
      const data = await adminApi.getSurveyResponses(selectedSurveyForResponses.id, locId, page, 15);
      setResponses(data.content);
      setResponseTotalPages(data.totalPages);
      setResponseTotalElements(data.totalElements);
      setResponsePage(page);
    } catch (err: any) {
      alert(err?.message || 'Không thể tải danh sách phản hồi.');
    } finally {
      setLoadingResponses(false);
    }
  };

  const handleLocationFilterChange = (locIdStr: string) => {
    const locId = locIdStr ? Number(locIdStr) : undefined;
    setFilterLocationId(locId);
    loadResponsesWithFilter(locId, 0);
  };

  const handleToggleSurvey = async (s: SurveyDto) => {
    try {
      await adminApi.toggleSurvey(s.id);
      loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi đổi trạng thái bài khảo sát');
    }
  };

  const handleDeleteSurvey = async (s: SurveyDto) => {
    if (!window.confirm(`Bạn có chắc chắn muốn xóa bài khảo sát "${s.title}" cùng toàn bộ dữ liệu phản hồi liên quan?`)) {
      return;
    }
    try {
      await adminApi.deleteSurvey(s.id);
      loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xóa bài khảo sát');
    }
  };

  const handleExportExcel = async () => {
    if (!selectedSurveyForResponses) return;
    setExportingExcel(true);
    try {
      await adminApi.exportSurveyResponsesExcel(selectedSurveyForResponses.id, selectedSurveyForResponses.title);
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xuất file báo cáo Excel');
    } finally {
      setExportingExcel(false);
    }
  };

  const handleExportCsv = async () => {
    if (!selectedSurveyForResponses) return;
    setExportingCsv(true);
    try {
      await adminApi.exportSurveyResponsesCsv(selectedSurveyForResponses.id);
    } catch (err: any) {
      alert(err?.message || 'Lỗi khi xuất file phản hồi CSV');
    } finally {
      setExportingCsv(false);
    }
  };

  // Helper: Decode answer JSON value safely
  const decodeAnswerValue = (answersJson: string, questionId?: number): string => {
    if (!questionId) return '—';
    try {
      const map = JSON.parse(answersJson);
      const val = map[questionId.toString()];
      if (val === undefined || val === null) return '—';
      if (Array.isArray(val)) return val.join(', ');
      return String(val);
    } catch {
      return '—';
    }
  };

  // Filter feedback text items
  const getAllTextFeedback = () => {
    if (!analytics) return [];
    const items: Array<{
      questionText: string;
      responseId: number;
      locationName: string;
      clientMac: string;
      submittedAt: string;
      answerText: string;
    }> = [];

    for (const qa of analytics.questionAnalytics) {
      if (qa.questionType === 'TEXT' && qa.textResponses) {
        for (const tr of qa.textResponses) {
          if (!feedbackSearch.trim() || tr.answerText.toLowerCase().includes(feedbackSearch.toLowerCase())) {
            items.push({
              questionText: qa.questionText,
              ...tr,
            });
          }
        }
      }
    }
    return items;
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Khảo Sát Ý Kiến Nhân Dân Về Dịch Vụ Số & Mạng Wi-Fi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết kế phiếu thăm dò ý kiến, kiểm soát hạn ngạch (Quota), tự động phân tích tỷ lệ phần trăm và xuất báo cáo Excel cho UBND Thành phố.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadInitialData}
            className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-100 bg-white rounded-sm text-xs font-semibold text-slate-700 transition shadow-xs cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" /> Làm mới
          </button>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition shadow-sm shadow-sky-600/20 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Tạo bài khảo sát mới
          </button>
        </div>
      </div>

      {error && <AlertBanner type="error" message={error} />}

      {/* Surveys Table */}
      <div className="bg-white rounded border border-slate-300 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-300 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-4">Tên bài khảo sát & Mô tả</th>
                <th className="py-3.5 px-4">Tiến độ thu thập (Quota)</th>
                <th className="py-3.5 px-4">Trạng thái</th>
                <th className="py-3.5 px-4">Ngày tạo</th>
                <th className="py-3.5 px-4 text-right">Thao tác & Phân tích</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
                    Đang tải danh sách bài khảo sát...
                  </td>
                </tr>
              ) : surveys.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    Chưa có bài khảo sát nào. Hãy bấm "Tạo bài khảo sát mới".
                  </td>
                </tr>
              ) : (
                surveys.map((s) => {
                  const quota = s.maxResponsesQuota || 1000;
                  const pct = Math.min(100, Math.round((s.currentResponsesCount / quota) * 100));
                  return (
                    <tr key={s.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-sm bg-purple-50 text-purple-600 flex items-center justify-center flex-shrink-0">
                            <ClipboardList className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="font-bold text-slate-900 block text-xs">{s.title}</span>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {s.campaignId ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-purple-700 bg-purple-50 px-1.5 py-0.5 rounded border border-purple-200">
                                  Chiến dịch #{s.campaignId}: {campaigns.find((c) => c.id === s.campaignId)?.title || 'Chiến dịch'}
                                </span>
                              ) : (
                                <span className="text-[10px] font-semibold text-sky-700 bg-sky-50 px-1.5 py-0.5 rounded border border-sky-200">
                                  Áp dụng chung toàn hệ thống
                                </span>
                              )}
                              <span className="text-slate-400">•</span>
                              <span className="text-slate-500 font-mono text-[10.5px]">
                                {s.questions?.length || 0} câu hỏi
                              </span>
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="w-36 space-y-1">
                          <div className="flex justify-between text-[11px] font-mono">
                            <span className="font-bold text-slate-800">{s.currentResponsesCount}</span>
                            <span className="text-slate-400">/ {quota}</span>
                          </div>
                          <div className="w-full bg-slate-100 rounded-full h-1.5 overflow-hidden">
                            <div
                              className={`h-full transition-all duration-500 ${
                                pct >= 100 ? 'bg-emerald-500' : 'bg-purple-600'
                              }`}
                              style={{ width: `${pct}%` }}
                            />
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <button
                          onClick={() => handleToggleSurvey(s)}
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded text-[11px] font-bold transition cursor-pointer ${
                            s.active
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              : 'bg-slate-100 text-slate-500 border border-slate-200 hover:bg-slate-200'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.active ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                          {s.active ? 'Đang phát sóng' : 'Tạm dừng'}
                        </button>
                      </td>

                      <td className="py-3.5 px-4 text-slate-500 font-mono text-[11px]">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            onClick={() => handleOpenAnalytics(s)}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#004b87] hover:bg-[#003865] text-white rounded text-xs font-bold transition shadow-xs cursor-pointer"
                            title="Mở Bảng phân tích và Danh sách kết quả phản hồi"
                          >
                            <BarChart2 className="w-3.5 h-3.5" />
                            <span>Xem kết quả & Phân tích</span>
                          </button>

                          <button
                            onClick={() => handleDeleteSurvey(s)}
                            className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded transition cursor-pointer"
                            title="Xóa khảo sát"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create New Survey */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Phiếu Khảo Sát Ý Kiến Nhân Dân"
        maxWidth="2xl"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề khảo sát <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              value={newSurveyTitle}
              onChange={(e) => setNewSurveyTitle(e.target.value)}
              placeholder="VD: Thăm dò mức độ hài lòng về tiện ích số tại Nhà văn hóa"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-1 focus:ring-[#004b87]"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Gắn với Chiến dịch tuyên truyền (Tùy chọn)
            </label>
            <select
              value={selectedCampaignId || ''}
              onChange={(e) => setSelectedCampaignId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm bg-white focus:outline-none focus:ring-1 focus:ring-[#004b87]"
            >
              <option value="">-- Áp dụng chung cho toàn bộ mạng Wi-Fi công cộng --</option>
              {campaigns.map((c) => (
                <option key={c.id} value={c.id}>
                  [{c.status}] {c.title}
                </option>
              ))}
            </select>
            <p className="text-[10.5px] text-slate-500 mt-1">
              Nếu không chọn chiến dịch, bài khảo sát sẽ tự động phát sóng chung cho tất cả các điểm Nhà văn hóa.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Mô tả ngắn</label>
              <input
                type="text"
                value={newSurveyDesc}
                onChange={(e) => setNewSurveyDesc(e.target.value)}
                placeholder="Khảo sát phục vụ nâng cấp chất lượng mạng công cộng"
                className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Định ngạch phản hồi tối đa (Quota)
              </label>
              <input
                type="number"
                min="10"
                max="50000"
                value={newSurveyQuota}
                onChange={(e) => setNewSurveyQuota(Number(e.target.value))}
                className="w-full px-3 py-2 text-xs font-mono border border-slate-200 rounded-sm"
                required
              />
            </div>
          </div>

          {/* Questions Builder */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                <GitBranch className="w-3.5 h-3.5 text-purple-600" /> Danh Sách Câu Hỏi ({questions.length})
              </span>
              <button
                type="button"
                onClick={handleAddQuestion}
                className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold text-[#004b87] bg-sky-50 hover:bg-sky-100 rounded-sm transition cursor-pointer"
              >
                <Plus className="w-3 h-3" /> Thêm câu hỏi
              </button>
            </div>

            {questions.map((q, idx) => (
              <div key={idx} className="p-3.5 bg-slate-50 border border-slate-200 rounded space-y-2.5 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-800 text-[11px] bg-slate-200/80 px-2 py-0.5 rounded">
                    Câu hỏi #{idx + 1}
                  </span>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center gap-1.5 cursor-pointer text-[11px] font-semibold text-slate-700 select-none">
                      <input
                        type="checkbox"
                        checked={q.required}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].required = e.target.checked;
                          setQuestions(updated);
                        }}
                        className="rounded text-[#004b87] focus:ring-[#004b87] w-3.5 h-3.5"
                      />
                      <span>Bắt buộc (*)</span>
                    </label>

                    <div className="flex items-center border border-slate-200 rounded bg-white">
                      <button
                        type="button"
                        disabled={idx === 0}
                        onClick={() => handleMoveQuestion(idx, 'UP')}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer"
                        title="Di chuyển lên trên"
                      >
                        <ArrowUp className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        disabled={idx === questions.length - 1}
                        onClick={() => handleMoveQuestion(idx, 'DOWN')}
                        className="p-1 text-slate-500 hover:text-slate-800 disabled:opacity-30 cursor-pointer border-l border-slate-200"
                        title="Di chuyển xuống dưới"
                      >
                        <ArrowDown className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {questions.length > 1 && (
                      <button
                        type="button"
                        onClick={() => handleRemoveQuestion(idx)}
                        className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                        title="Xóa câu hỏi này"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <input
                  type="text"
                  value={q.questionText}
                  onChange={(e) => {
                    const updated = [...questions];
                    updated[idx].questionText = e.target.value;
                    setQuestions(updated);
                  }}
                  placeholder="Nhập nội dung câu hỏi..."
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-sm font-medium"
                  required
                />

                <div className="space-y-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Loại câu hỏi</label>
                    <select
                      value={q.questionType}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].questionType = e.target.value as any;
                        if ((e.target.value === 'SINGLE_CHOICE' || e.target.value === 'MULTI_CHOICE') && (!q.optionsList || q.optionsList.length === 0)) {
                          updated[idx].optionsList = ['Lựa chọn 1', 'Lựa chọn 2'];
                        }
                        setQuestions(updated);
                      }}
                      className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-sm"
                    >
                      <option value="SINGLE_CHOICE">Trắc nghiệm chọn 1 (Single Choice)</option>
                      <option value="MULTI_CHOICE">Trắc nghiệm chọn nhiều (Multi Choice)</option>
                      <option value="RATING">Đánh giá 1 - 5 Sao (Rating)</option>
                      <option value="TEXT">Tự luận nhập văn bản (Text)</option>
                    </select>
                  </div>

                  {(q.questionType === 'SINGLE_CHOICE' || q.questionType === 'MULTI_CHOICE') && (
                    <div className="bg-white p-2.5 rounded border border-slate-200 space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-[10.5px] font-bold text-slate-700">
                          Các lựa chọn trả lời ({q.optionsList?.length || 0}):
                        </label>
                        <button
                          type="button"
                          onClick={() => handleAddOption(idx)}
                          className="inline-flex items-center gap-1 text-[10.5px] font-bold text-[#004b87] hover:underline cursor-pointer"
                        >
                          <Plus className="w-3 h-3" /> Thêm lựa chọn
                        </button>
                      </div>

                      <div className="space-y-1.5">
                        {(q.optionsList || []).map((opt, optIdx) => (
                          <div key={optIdx} className="flex items-center gap-1.5">
                            <span className="text-[10px] text-slate-400 font-mono w-4 text-center">{optIdx + 1}.</span>
                            <input
                              type="text"
                              value={opt}
                              onChange={(e) => handleUpdateOption(idx, optIdx, e.target.value)}
                              placeholder={`Lựa chọn ${optIdx + 1}`}
                              className="flex-1 px-2 py-1 text-xs bg-slate-50 border border-slate-200 rounded focus:bg-white"
                              required
                            />
                            {q.optionsList.length > 2 && (
                              <button
                                type="button"
                                onClick={() => handleRemoveOption(idx, optIdx)}
                                className="text-slate-400 hover:text-rose-500 p-1 cursor-pointer"
                                title="Xóa lựa chọn này"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          <div className="flex justify-end gap-2.5 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-sm text-xs font-bold transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={creating}
              className="px-4 py-2 bg-[#004b87] hover:bg-[#003865] text-white rounded-sm text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-sm shadow-sky-600/20"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
              Lưu & Xuất bản khảo sát
            </button>
          </div>
        </form>
      </Modal>

      {/* Modal 2: Comprehensive Analytics & Feedback Center */}
      <Modal
        isOpen={!!selectedSurveyForResponses}
        onClose={() => setSelectedSurveyForResponses(null)}
        title={`Trung Tâm Phân Tích & Phản Hồi: ${selectedSurveyForResponses?.title || ''}`}
        maxWidth="5xl"
      >
        <div className="space-y-4 text-xs">
          {/* Header Action Bar: Export Buttons & Quick Stats */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 p-3 rounded-lg border border-slate-200">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-md bg-[#004b87] text-white flex items-center justify-center shadow-xs">
                <BarChart2 className="w-5 h-5" />
              </div>
              <div>
                <h2 className="font-extrabold text-slate-900 text-sm">{selectedSurveyForResponses?.title}</h2>
                <p className="text-[11px] text-slate-500">
                  Tổng phản hồi: <strong>{analytics?.totalResponses ?? selectedSurveyForResponses?.currentResponsesCount ?? 0}</strong> phiếu • Hạn ngạch: <strong>{selectedSurveyForResponses?.maxResponsesQuota ?? 1000}</strong>
                </p>
              </div>
            </div>

            {/* Export Buttons */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={handleExportExcel}
                disabled={exportingExcel}
                className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                title="Tải báo cáo định dạng Microsoft Excel 2 Sheet (Chi tiết + Thống kê %)"
              >
                {exportingExcel ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileSpreadsheet className="w-4 h-4" />}
                <span>Xuất Báo Cáo Excel (.xlsx)</span>
              </button>

              <button
                type="button"
                onClick={handleExportCsv}
                disabled={exportingCsv}
                className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-300 hover:bg-slate-100 bg-white text-slate-700 rounded text-xs font-semibold transition cursor-pointer disabled:opacity-50"
              >
                {exportingCsv ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-3.5 h-3.5" />}
                <span>Xuất CSV</span>
              </button>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center border-b border-slate-200 gap-1">
            <button
              type="button"
              onClick={() => setActiveAnalyticsTab('ANALYTICS')}
              className={`px-4 py-2.5 font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeAnalyticsTab === 'ANALYTICS'
                  ? 'border-[#004b87] text-[#004b87]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <PieChart className="w-4 h-4" />
              <span>Biểu Đồ & Thống Kê (%)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAnalyticsTab('RESPONSES')}
              className={`px-4 py-2.5 font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeAnalyticsTab === 'RESPONSES'
                  ? 'border-[#004b87] text-[#004b87]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <FileText className="w-4 h-4" />
              <span>Danh Sách Phản Hồi Chi Tiết ({responseTotalElements})</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveAnalyticsTab('FEEDBACK')}
              className={`px-4 py-2.5 font-bold text-xs flex items-center gap-1.5 border-b-2 transition cursor-pointer ${
                activeAnalyticsTab === 'FEEDBACK'
                  ? 'border-[#004b87] text-[#004b87]'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              <MessageSquare className="w-4 h-4" />
              <span>Tường Ý Kiến Nhân Dân ({getAllTextFeedback().length})</span>
            </button>
          </div>

          {/* ================= TAB 1: ANALYTICS & CHARTS ================= */}
          {activeAnalyticsTab === 'ANALYTICS' && (
            <div className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
              {loadingAnalytics ? (
                <div className="py-12 text-center text-slate-400">
                  <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2 text-[#004b87]" />
                  Đang tổng hợp số liệu và tính toán tỷ lệ phần trăm...
                </div>
              ) : !analytics ? (
                <div className="py-12 text-center text-slate-400">Không có dữ liệu phân tích.</div>
              ) : (
                <>
                  {/* KPI Overview Tiles */}
                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium">Tổng mẫu thu thập</div>
                      <div className="text-xl font-extrabold text-slate-900 mt-1 font-mono">
                        {analytics.totalResponses}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Hạn ngạch định mức: {analytics.maxResponsesQuota}
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium">Tiến độ hoàn thành</div>
                      <div className="text-xl font-extrabold text-purple-700 mt-1 font-mono">
                        {analytics.completionRatePercent}%
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1.5 overflow-hidden">
                        <div
                          className="h-full bg-purple-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(100, analytics.completionRatePercent)}%` }}
                        />
                      </div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium">Điểm đánh giá trung bình</div>
                      <div className="text-xl font-extrabold text-amber-600 mt-1 flex items-center gap-1 font-mono">
                        {analytics.averageRating ? `${analytics.averageRating}` : '—'}
                        {analytics.averageRating && <Star className="w-4 h-4 fill-amber-400 text-amber-500" />}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Thang điểm 5.0 (CSAT)</div>
                    </div>

                    <div className="p-3 bg-white border border-slate-200 rounded-lg shadow-xs">
                      <div className="text-[11px] text-slate-500 font-medium">Nhà văn hóa tham gia</div>
                      <div className="text-xl font-extrabold text-[#004b87] mt-1 font-mono">
                        {Object.keys(analytics.locationDistribution).length}
                      </div>
                      <div className="text-[10px] text-slate-400 mt-0.5">Điểm phát sóng cơ sở</div>
                    </div>
                  </div>

                  {/* Question Breakdown Cards */}
                  <div className="space-y-3 pt-2">
                    <h3 className="font-bold text-slate-900 text-xs uppercase tracking-wider flex items-center gap-1.5">
                      <PieChart className="w-4 h-4 text-[#004b87]" />
                      <span>Phân Tích Tỷ Lệ Theo Từng Câu Hỏi</span>
                    </h3>

                    {analytics.questionAnalytics.map((qa, qIndex) => (
                      <div key={qa.questionId || qIndex} className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <span className="text-[10.5px] font-bold text-[#004b87] uppercase tracking-wide">
                              Câu hỏi #{qIndex + 1}
                            </span>
                            <h4 className="font-bold text-slate-900 text-sm mt-0.5">{qa.questionText}</h4>
                          </div>
                          <span className="text-[10px] font-semibold px-2 py-0.5 bg-slate-100 text-slate-700 rounded border border-slate-200 flex-shrink-0">
                            {qa.questionType === 'SINGLE_CHOICE' && 'Trắc nghiệm chọn 1'}
                            {qa.questionType === 'MULTI_CHOICE' && 'Trắc nghiệm chọn nhiều'}
                            {qa.questionType === 'RATING' && 'Đánh giá 1 - 5 Sao'}
                            {qa.questionType === 'TEXT' && 'Ý kiến tự luận'}
                          </span>
                        </div>

                        {/* Rendering by Question Type */}
                        {qa.questionType === 'TEXT' ? (
                          <div className="p-3 bg-slate-50 border border-slate-200 rounded flex items-center justify-between text-xs text-slate-700">
                            <span>
                              Đã thu thập <strong>{qa.textResponses.length}</strong> ý kiến đóng góp bằng văn bản của người dân.
                            </span>
                            <button
                              type="button"
                              onClick={() => setActiveAnalyticsTab('FEEDBACK')}
                              className="font-bold text-[#004b87] hover:underline inline-flex items-center gap-1 cursor-pointer"
                            >
                              <span>Xem trên Tường Ý Kiến</span>
                              <ChevronRight className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : qa.questionType === 'RATING' ? (
                          <div className="space-y-2">
                            {[5, 4, 3, 2, 1].map((star) => {
                              const count = qa.ratingCounts[star] || 0;
                              const pct = qa.totalAnswersCount > 0 ? (count * 100.0) / qa.totalAnswersCount : 0;
                              return (
                                <div key={star} className="space-y-1">
                                  <div className="flex justify-between text-[11px]">
                                    <span className="font-semibold text-slate-700 flex items-center gap-1">
                                      <span>{star} Sao</span>
                                      <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-500" />
                                    </span>
                                    <span className="font-mono text-slate-500">
                                      <strong>{count}</strong> ({pct.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-amber-400 rounded-full transition-all duration-500"
                                      style={{ width: `${pct}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        ) : (
                          /* SINGLE_CHOICE or MULTI_CHOICE Progress Bars */
                          <div className="space-y-2.5">
                            {Object.entries(qa.optionCounts).map(([option, count]) => {
                              const pct = qa.optionPercentages[option] || 0;
                              return (
                                <div key={option} className="space-y-1">
                                  <div className="flex justify-between text-[11.5px]">
                                    <span className="font-semibold text-slate-800">{option}</span>
                                    <span className="font-mono text-slate-600">
                                      <strong className="text-slate-900">{count}</strong> lượt ({pct.toFixed(1)}%)
                                    </span>
                                  </div>
                                  <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                                    <div
                                      className="h-full bg-[#004b87] rounded-full transition-all duration-500"
                                      style={{ width: `${Math.min(100, pct)}%` }}
                                    />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Location Distribution Card */}
                  <div className="p-4 bg-white border border-slate-200 rounded-lg shadow-xs space-y-2.5">
                    <h4 className="font-bold text-slate-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                      <MapPin className="w-4 h-4 text-[#a81c1c]" />
                      <span>Phân Bổ Lượng Ý Kiến Theo Điểm Nhà Văn Hóa</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                      {Object.entries(analytics.locationDistribution).map(([locName, count]) => (
                        <div key={locName} className="p-2.5 bg-slate-50 border border-slate-200 rounded flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-800 truncate pr-2">{locName}</span>
                          <span className="font-bold text-[#004b87] font-mono px-2 py-0.5 bg-sky-50 border border-sky-200 rounded">
                            {count} phiếu
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {/* ================= TAB 2: DETAILED RESPONSES GRID ================= */}
          {activeAnalyticsTab === 'RESPONSES' && (
            <div className="space-y-3">
              {/* Filter Toolbar */}
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 bg-slate-50 p-2.5 rounded border border-slate-200">
                <div className="flex items-center gap-2">
                  <Filter className="w-3.5 h-3.5 text-slate-500 flex-shrink-0" />
                  <span className="text-[11px] font-bold text-slate-700">Lọc theo điểm:</span>
                  <select
                    value={filterLocationId || ''}
                    onChange={(e) => handleLocationFilterChange(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded text-xs focus:outline-none focus:border-[#004b87]"
                  >
                    <option value="">-- Tất cả các điểm Nhà văn hóa --</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="text-[11px] text-slate-500 font-mono">
                  Hiển thị <strong>{responses.length}</strong> / tổng số <strong>{responseTotalElements}</strong> phiếu phản hồi
                </div>
              </div>

              {/* Data Table */}
              <div className="border border-slate-200 rounded overflow-x-auto max-h-[50vh]">
                <table className="w-full text-left border-collapse text-xs">
                  <thead className="bg-slate-100 text-slate-700 sticky top-0 z-10 text-[10.5px] uppercase font-bold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">STT</th>
                      <th className="py-2.5 px-3">Mã phiếu</th>
                      <th className="py-2.5 px-3">Thời gian</th>
                      <th className="py-2.5 px-3">Nhà văn hóa</th>
                      <th className="py-2.5 px-3">Địa chỉ MAC</th>
                      {selectedSurveyForResponses?.questions?.map((q) => (
                        <th key={q.id} className="py-2.5 px-3 min-w-[160px]">
                          {q.questionText}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {loadingResponses ? (
                      <tr>
                        <td colSpan={5 + (selectedSurveyForResponses?.questions?.length || 0)} className="py-8 text-center text-slate-400">
                          <Loader2 className="w-5 h-5 animate-spin mx-auto mb-1 text-[#004b87]" />
                          Đang tải dữ liệu phản hồi...
                        </td>
                      </tr>
                    ) : responses.length === 0 ? (
                      <tr>
                        <td colSpan={5 + (selectedSurveyForResponses?.questions?.length || 0)} className="py-8 text-center text-slate-400">
                          Không tìm thấy câu trả lời nào phù hợp với bộ lọc.
                        </td>
                      </tr>
                    ) : (
                      responses.map((r, rIdx) => (
                        <tr key={r.id} className="hover:bg-slate-50 transition">
                          <td className="py-2 px-3 font-mono text-slate-400">
                            {responsePage * 15 + rIdx + 1}
                          </td>
                          <td className="py-2 px-3 font-mono font-bold text-slate-700">
                            #{r.id}
                          </td>
                          <td className="py-2 px-3 text-slate-500 font-mono text-[10.5px] whitespace-nowrap">
                            {new Date(r.submittedAt).toLocaleString('vi-VN')}
                          </td>
                          <td className="py-2 px-3 font-semibold text-slate-800 whitespace-nowrap">
                            <span className="flex items-center gap-1">
                              <MapPin className="w-3 h-3 text-[#a81c1c] flex-shrink-0" />
                              <span>{r.locationName || 'Chung hệ thống'}</span>
                            </span>
                          </td>
                          <td className="py-2 px-3 font-mono text-slate-600 text-[10.5px]">
                            {r.clientMac?.toUpperCase()}
                          </td>
                          {selectedSurveyForResponses?.questions?.map((q) => {
                            const val = decodeAnswerValue(r.answersJson, q.id);
                            return (
                              <td key={q.id} className="py-2 px-3 font-sans text-slate-800">
                                {val === '—' ? (
                                  <span className="text-slate-300">—</span>
                                ) : (
                                  <span className="inline-block px-2 py-0.5 rounded bg-slate-100 border border-slate-200 text-slate-900 text-[11px]">
                                    {val}
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {responseTotalPages > 1 && (
                <div className="flex items-center justify-between pt-2">
                  <span className="text-[11px] text-slate-500">
                    Trang {responsePage + 1} / {responseTotalPages}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      disabled={responsePage <= 0}
                      onClick={() => loadResponsesWithFilter(filterLocationId, responsePage - 1)}
                      className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={responsePage >= responseTotalPages - 1}
                      onClick={() => loadResponsesWithFilter(filterLocationId, responsePage + 1)}
                      className="px-2.5 py-1 border border-slate-200 rounded text-xs hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ================= TAB 3: CITIZEN FEEDBACK WALL ================= */}
          {activeAnalyticsTab === 'FEEDBACK' && (
            <div className="space-y-3">
              {/* Search Toolbar */}
              <div className="flex items-center gap-2 bg-slate-50 p-2.5 rounded border border-slate-200">
                <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
                <input
                  type="text"
                  value={feedbackSearch}
                  onChange={(e) => setFeedbackSearch(e.target.value)}
                  placeholder="Tìm kiếm từ khóa trong ý kiến tự luận (VD: wifi, thủ tục, đèn, cán bộ...)"
                  className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded focus:outline-none focus:border-[#004b87]"
                />
                {feedbackSearch && (
                  <button
                    type="button"
                    onClick={() => setFeedbackSearch('')}
                    className="text-xs text-slate-400 hover:text-slate-600 px-2"
                  >
                    Xóa
                  </button>
                )}
              </div>

              {/* Feedback Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[55vh] overflow-y-auto pr-1">
                {getAllTextFeedback().length === 0 ? (
                  <div className="col-span-2 py-12 text-center text-slate-400">
                    Chưa có ý kiến tự luận nào phù hợp với từ khóa tìm kiếm.
                  </div>
                ) : (
                  getAllTextFeedback().map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3.5 bg-white border border-slate-200 rounded-lg shadow-xs hover:border-slate-300 transition space-y-2 flex flex-col justify-between"
                    >
                      <div className="space-y-1.5">
                        <div className="flex items-start gap-2">
                          <Quote className="w-4 h-4 text-purple-600 flex-shrink-0 mt-0.5" />
                          <div className="text-[10px] text-purple-700 font-bold uppercase tracking-wider">
                            {item.questionText}
                          </div>
                        </div>
                        <p className="text-xs text-slate-900 font-sans leading-relaxed pl-6">
                          "{item.answerText}"
                        </p>
                      </div>

                      <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500 font-mono">
                        <span className="flex items-center gap-1 font-semibold text-slate-700">
                          <MapPin className="w-3 h-3 text-[#a81c1c]" />
                          <span>{item.locationName}</span>
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          <span>{new Date(item.submittedAt).toLocaleDateString('vi-VN')}</span>
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}

          {/* Modal Footer */}
          <div className="flex justify-end pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setSelectedSurveyForResponses(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
