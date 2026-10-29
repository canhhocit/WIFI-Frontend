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
  FileSpreadsheet
} from 'lucide-react';
import { adminApi } from '../../api/adminApi';
import { SurveyDto, SurveyQuestionDto, SurveyResponseDto } from '../../types/models';
import { Modal } from '../../components/Modal';
import { AlertBanner } from '../../components/AlertBanner';

export const SurveysPage: React.FC = () => {
  const [surveys, setSurveys] = useState<SurveyDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Create Survey Modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newSurveyTitle, setNewSurveyTitle] = useState('');
  const [newSurveyDesc, setNewSurveyDesc] = useState('');
  const [newSurveyQuota, setNewSurveyQuota] = useState(500);
  const [questions, setQuestions] = useState<Array<{
    questionText: string;
    questionType: 'SINGLE_CHOICE' | 'MULTI_CHOICE' | 'TEXT' | 'RATING';
    options: string;
    required: boolean;
  }>>([
    {
      questionText: 'Quý vị đánh giá chất lượng sóng Wi-Fi tại Nhà văn hóa hôm nay như thế nào?',
      questionType: 'SINGLE_CHOICE',
      options: 'Rất tốt, Ổn định, Chập chờn, Không vào được mạng',
      required: true,
    },
    {
      questionText: 'Ý kiến đóng góp thêm về tiện ích chuyển đổi số tại địa phương:',
      questionType: 'TEXT',
      options: '',
      required: false,
    }
  ]);

  // View Responses Modal
  const [selectedSurveyForResponses, setSelectedSurveyForResponses] = useState<SurveyDto | null>(null);
  const [responses, setResponses] = useState<SurveyResponseDto[]>([]);
  const [loadingResponses, setLoadingResponses] = useState(false);

  useEffect(() => {
    loadSurveys();
  }, []);

  const loadSurveys = async () => {
    setLoading(true);
    try {
      const resp = await adminApi.getSurveys({ size: 50 });
      setSurveys(resp.content);
      setError(null);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải danh sách bài khảo sát ý kiến.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuestion = () => {
    setQuestions([
      ...questions,
      {
        questionText: '',
        questionType: 'SINGLE_CHOICE',
        options: 'Rất hài lòng, Hài lòng, Chưa hài lòng',
        required: true,
      }
    ]);
  };

  const handleRemoveQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSurveyTitle.trim()) return;

    setCreating(true);
    try {
      const payloadQuestions: SurveyQuestionDto[] = questions.map((q, idx) => ({
        questionText: q.questionText.trim(),
        questionType: q.questionType,
        optionsJson: q.options
          ? JSON.stringify(q.options.split(',').map((s) => s.trim()).filter(Boolean))
          : undefined,
        sortOrder: idx,
        required: q.required,
      }));

      await adminApi.createSurvey({
        id: 0,
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
      loadSurveys();
    } catch (err: any) {
      alert(err?.message || 'Không thể tạo bài khảo sát mới.');
    } finally {
      setCreating(false);
    }
  };

  const handleViewResponses = async (s: SurveyDto) => {
    setSelectedSurveyForResponses(s);
    setLoadingResponses(true);
    try {
      const resp = await adminApi.getSurveyResponses(s.id, 0, 50);
      setResponses(resp.content);
    } catch (err: any) {
      alert(err?.message || 'Không thể tải danh sách câu trả lời khảo sát');
    } finally {
      setLoadingResponses(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Động Cơ Khảo Sát Rẽ Nhánh (Survey Engine)</h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Thiết kế phiếu thăm dò ý kiến nhân dân, kiểm soát định ngạch (Quota), thu thập mức độ hài lòng về hạ tầng số.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={loadSurveys}
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
                <th className="py-3.5 px-4 text-right">Hành động</th>
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
                            <span className="text-[11px] text-slate-400 line-clamp-1 max-w-sm">
                              {s.description || 'Không có mô tả chi tiết'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="py-3.5 px-4 w-48">
                        <div className="flex items-center justify-between text-[11px] mb-1 font-semibold text-slate-700">
                          <span>{s.currentResponsesCount} phản hồi</span>
                          <span className="text-slate-400 font-normal">Chỉ tiêu: {quota}</span>
                        </div>
                        <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                          <div
                            className={`h-full transition-all duration-300 rounded-full ${
                              pct >= 100 ? 'bg-emerald-500' : 'bg-purple-600'
                            }`}
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        {s.active ? (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-sm text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-500" /> Đang mở nhận
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 font-semibold text-slate-500 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded-sm text-[11px]">
                            Đã đóng
                          </span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">
                        {s.createdAt ? new Date(s.createdAt).toLocaleDateString('vi-VN') : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleViewResponses(s)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-sm text-xs font-bold transition cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" /> Xem phản hồi ({s.currentResponsesCount})
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal 1: Create Survey Wizard */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Tạo Bài Khảo Sát / Phiếu Lấy Ý Kiến Mới"
        maxWidth="lg"
      >
        <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs max-h-[75vh] overflow-y-auto pr-1">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Tiêu đề bài khảo sát <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={newSurveyTitle}
              onChange={(e) => setNewSurveyTitle(e.target.value)}
              placeholder="Ví dụ: Đánh giá chất lượng dịch vụ Wi-Fi Nhà văn hóa quý 4"
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-sm focus:outline-none focus:ring-2 focus:ring-1 focus:ring-[#004b87]"
              required
            />
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
              <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-sm space-y-2 relative">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-700 text-[11px]">Câu hỏi #{idx + 1}</span>
                  {questions.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveQuestion(idx)}
                      className="text-slate-400 hover:text-rose-600 p-1 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
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
                  className="w-full px-2.5 py-1.5 text-xs bg-white border border-slate-200 rounded-sm"
                  required
                />

                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">Loại câu hỏi</label>
                    <select
                      value={q.questionType}
                      onChange={(e) => {
                        const updated = [...questions];
                        updated[idx].questionType = e.target.value as any;
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
                  {q.questionType !== 'TEXT' && q.questionType !== 'RATING' && (
                    <div>
                      <label className="block text-[10px] font-semibold text-slate-500 mb-0.5">
                        Các lựa chọn (phân cách bằng dấu phẩy)
                      </label>
                      <input
                        type="text"
                        value={q.options}
                        onChange={(e) => {
                          const updated = [...questions];
                          updated[idx].options = e.target.value;
                          setQuestions(updated);
                        }}
                        placeholder="VD: Rất tốt, Tốt, Kém"
                        className="w-full px-2 py-1 text-xs bg-white border border-slate-200 rounded-sm font-mono text-[11px]"
                      />
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

      {/* Modal 2: View Responses */}
      <Modal
        isOpen={!!selectedSurveyForResponses}
        onClose={() => setSelectedSurveyForResponses(null)}
        title={`Kết Quả Phản Hồi: ${selectedSurveyForResponses?.title}`}
        maxWidth="lg"
      >
        <div className="space-y-4 text-xs">
          {loadingResponses ? (
            <div className="py-8 text-center text-slate-400">
              <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#004b87]" />
              Đang tải danh sách câu trả lời...
            </div>
          ) : responses.length === 0 ? (
            <div className="py-8 text-center text-slate-400">Chưa có người dân nào gửi câu trả lời cho khảo sát này.</div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto divide-y divide-slate-100">
              {responses.map((r) => (
                <div key={r.id} className="py-3 space-y-1.5">
                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <span>MAC: <strong className="text-slate-700">{r.clientMac}</strong></span>
                    <span>{new Date(r.submittedAt).toLocaleString('vi-VN')}</span>
                  </div>
                  <div className="bg-slate-50 p-2.5 rounded-sm border border-slate-200 font-mono text-[11px] text-slate-700">
                    {r.answersJson}
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setSelectedSurveyForResponses(null)}
              className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-sm text-xs font-bold transition cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
