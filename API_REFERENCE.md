# 📡 Mindory Backend API Reference

> Base URL: `http://localhost:4000`  
> Tất cả request/response đều dùng `Content-Type: application/json`  
> Các route có 🔒 yêu cầu header: `Authorization: Bearer <supabase_jwt_token>`

---

## 🔐 Auth

### `GET /auth/me` 🔒 — Lấy thông tin người dùng đang login
**Response `200`:**
```json
{ "id": "...", "email": "...", "full_name": "Thiện", "role": "parent", "parent_id": null, "avatar_url": null }
```

### `PATCH /auth/profile` 🔒 — Cập nhật thông tin cá nhân
**Body (tất cả optional, ít nhất 1 field):**
```json
{ "fullName": "Tên Mới", "avatarUrl": "https://example.com/avatar.jpg" }
```
**Response `200`:** Profile object đã cập nhật  
> ⚠️ `avatarUrl` phải là URL hợp lệ, Zod sẽ trả `400` nếu sai format.

---

## 👨‍👩‍👧 Children (Quản lý Hồ sơ Trẻ)

### `POST /children` — Tạo tài khoản cho bé
**Body:**
```json
{ "email": "be.minh@gmail.com", "password": "123456", "fullName": "Bé Minh", "parentId": "<uuid>" }
```
**Response `201`:** `{ "success": true, "user": { "id": "...", "email": "..." } }`

### `GET /children?parentId=<uuid>&page=1&limit=20` — Danh sách con của phụ huynh
**Response `200`:**
```json
{ "data": [...profiles], "total": 3 }
```
> ✅ Chỉ trả về các bé chưa bị xóa (`deleted_at IS NULL`).

### `PATCH /children/:id` 🔒 — Sửa thông tin con
**Body (tất cả optional, cần ít nhất 1 field phụ ngoài parentId):**
```json
{ "parentId": "<uuid>", "fullName": "Tên Bé Mới", "avatarUrl": "https://..." }
```
**Response `200`:** Profile object của con đã cập nhật.

### `DELETE /children/:id` 🔒 — Xóa tài khoản bé (Soft Delete)
**Body:** `{ "parentId": "<uuid>" }`  
**Response `200`:** `{ "success": true, "message": "..." }`  
> ✅ Không xóa vĩnh viễn, chỉ set `deleted_at`. Trẻ bị xóa sẽ không đăng nhập vào được.

### `PATCH /children/:id/restore` 🔒 — Khôi phục tài khoản bé đã xóa
**Body:** `{ "parentId": "<uuid>" }`  
**Response `200`:** Khôi phục thành công.

---

## 📚 Subjects (Môn học)

### `GET /subjects?grade=3&page=1&limit=20` — Danh sách môn học
`grade` (1–5) là tùy chọn.

### `POST /subjects` 🔒 *(Admin only)* — Tạo môn học
**Body:** `{ "name": "Toán", "grade": 3 }`

### `PUT /subjects/:id` 🔒 *(Admin only)* — Sửa môn học
**Body (tất cả optional):** `{ "name": "Toán Nâng Cao", "grade": 4 }`

### `DELETE /subjects/:id` 🔒 *(Admin only)* — Xóa môn học (Soft Delete)
**Response `200`:** `{ "success": true }`

---

## 📖 Lessons (Bài học)

### `GET /lessons?subjectId=<uuid>&page=1&limit=20` — Danh sách bài học
### `GET /lessons/:id` — Chi tiết bài học (có `pdf_url`, tên môn, lớp)

**Response `200`:**
```json
{
  "id": "...", "title": "Bài 1", "pdf_url": "https://...", "total_pages": 20,
  "subjects": { "name": "Toán", "grade": 3 }
}
```

### `POST /lessons` 🔒 *(Admin only)* — Tạo bài học
**Body:** `{ "subjectId", "title", "pdfUrl", "description?", "totalPages?" }`

### `PUT /lessons/:id` 🔒 *(Admin only)* — Sửa bài học
**Body (optional):** `{ "title", "pdfUrl", "description", "totalPages" }`

### `DELETE /lessons/:id` 🔒 *(Admin only)* — Xóa bài học (Soft Delete)
**Response `200`:** `{ "success": true }`

---

## ❓ Quizzes (Trắc nghiệm)

### `GET /quizzes?lessonId=<uuid>` — Câu hỏi của 1 bài học
**Response `200`:**
```json
[{ "id": "...", "question": "1+1=?", "options": ["1","2","3","4"], "correct_index": 1 }]
```

### `POST /quizzes` 🔒 *(Admin only)* — Thêm câu hỏi
**Body:** `{ "lessonId", "question", "options": ["A","B","C","D"], "correctIndex": 0 }`

### `PUT /quizzes/:id` 🔒 *(Admin only)* — Sửa câu hỏi
**Body (optional):** `{ "question", "options", "correctIndex" }`

### `DELETE /quizzes/:id` 🔒 *(Admin only)* — Xóa câu hỏi (Soft Delete)
**Response `200`:** `{ "success": true }`

---

## 📋 Tasks (Bài tập được giao)

### `POST /tasks` 🔒 — Parent giao bài
**Body:**
```json
{
  "childId": "...", "lessonId": "...", "parentId": "...",
  "sessionDuration": 30, "sessionsPerDay": 2, "startPage": 1, "endPage": 10
}
```
**Response `201`:** `assigned_task` object

### `GET /tasks?childId=<uuid>&page=1&limit=20` 🔒 — Parent xem bài đã giao
**Response `200`:** `{ "data": [...tasks + lessons info], "total": N }`

### `GET /tasks/:id` 🔒 — Chi tiết 1 task (kèm thông tin lesson + tên bé)
**Response `200`:**
```json
{
  "id": "...", "status": "pending",
  "lessons": { "title": "...", "pdf_url": "...", "total_pages": 20 },
  "profiles": { "full_name": "Bé Minh" }
}
```

### `GET /tasks/mine?childId=<uuid>&page=1&limit=20` 🔒 — **Child** xem bài của mình
**Response `200`:** `{ "data": [...tasks + lessons info], "total": N }`

### `PATCH /tasks/:id/status` 🔒 — Cập nhật trạng thái task
**Body:** `{ "status": "in_progress" | "completed", "childId": "<uuid>" }`  
> ⚠️ `childId` phải khớp owner. Sai → `403`.

### `PUT /tasks/:id` 🔒 — Tiện ích: Parent sửa bài đã giao
**Body:** `{ "parentId": "<uuid>", "sessionDuration?", "sessionsPerDay?", "startPage?", "endPage?" }`  
> ⚠️ Chỉ được sửa task CHƯA `completed` (nếu hoàn thành rồi sẽ báo lỗi).

### `DELETE /tasks/:id` 🔒 — Tiện ích: Parent xóa bài đã giao (Soft Delete)
**Body:** `{ "parentId": "<uuid>" }`  
**Response `200`:** `{ "success": true, "message": "..." }`

---

## 🎓 Sessions (Buổi học)

### `POST /sessions/start` 🔒 — Bé bắt đầu học
**Body:** `{ "taskId": "...", "childId": "..." }`  
**Response `201`:** `learning_session` object (lấy `id` dùng ở bước finish)  
> ⚠️ Task phải chưa `completed`. Task tự chuyển sang `in_progress`.

### `POST /sessions/:id/finish` 🔒 — Bé nộp bài
**Body:** `{ "childId": "...", "quizScore": 4, "quizTotal": 5 }`  
**Response `200`:**
```json
{
  "session": { "focus_minutes": 22, "quiz_score": 4, "completed": true },
  "reward": { "reward_type": "game", "duration_seconds": 300 }
}
```
> ✅ Logic reward: `score/total >= 70%` → **game** (300s), còn lại → **music** (120s)  
> ⚠️ Gọi lần 2 khi đã completed → `400 Session already completed`

### `GET /sessions/mine?childId=<uuid>` 🔒 — **Child** xem lịch sử học
### `GET /sessions/stats?parentId=<uuid>` 🔒 — **Parent** xem thống kê tổng hợp
**Response `200`:**
```json
{ "children": [...], "totalSessions": 15, "avgFocusMinutes": 24, "avgQuizScore": 78 }
```

---

## 🏆 Rewards (Phần thưởng)

> ⚠️ Reward được tạo **tự động** khi bé `POST /sessions/:id/finish`. Frontend KHÔNG cần gọi tạo reward.

### `GET /rewards/mine?childId=<uuid>` 🔒 — **Child** xem kho báu
### `PATCH /rewards/:id/claim` 🔒 — Bé nhận phần thưởng
**Body:** `{ "childId": "..." }`  
> ⚠️ Claim lần 2 → `400`. Sai childId → `403`.

---

## 🗺️ Quy trình bảo vệ Admin Routes & User Roles

Các Role hiện tại: `admin`, `parent`, `child`.  
Frontend muốn tạo admin thì chỉ việc đổi cột `role` trong bảng `profiles` trực tiếp trên Supabase thành `admin`. Các API bên dưới đã được bảo vệ ngặt nghèo ở Backend:
- `POST/PUT/DELETE /subjects`
- `POST/PUT/DELETE /lessons`
- `POST/PUT/DELETE /quizzes`

---

## 🗺️ Frontend Implementation Checklist

### Role 2 — Parent Portal

- [ ] **Dashboard** (`/parent`): Gọi `GET /sessions/stats?parentId=...` → Hiển thị `avgFocusMinutes`, `avgQuizScore` thật
- [ ] **Profile** (`/parent/profile`): Gọi `GET /auth/me` + `PATCH /auth/profile` cho phép sửa tên/avatar
- [ ] **Danh sách con** (`/parent/children`): Gọi `GET /children?parentId&page&limit` + `PATCH /children/:id` (sửa) + `DELETE /children/:id` (xóa)
- [ ] **Giao bài** (`/parent/assign`): Gọi `GET /subjects` → `GET /lessons?subjectId` → `POST /tasks`
- [ ] **Xem / Chỉnh sửa tiến độ con**: Gọi `GET /tasks?childId=...` + `PUT /tasks/:id` (Sửa bài) + `DELETE /tasks/:id` (Hủy bài đã giao)

### Role 3 — Child Portal *(Xây mới hoàn toàn)*

- [ ] **Dashboard** (`/child`): Gọi `GET /tasks/mine?childId=...` → Hiển thị danh sách bài hôm nay
- [ ] **Bắt đầu học**: Gọi `POST /sessions/start` → Lưu `session.id`
- [ ] **Đọc bài**: Hiển thị PDF từ `lessons.pdf_url` (từ `GET /tasks/:id`), có đồng hồ đếm phút
- [ ] **Làm trắc nghiệm**: Gọi `GET /quizzes?lessonId=...` → Tính điểm local
- [ ] **Nộp bài**: Gọi `POST /sessions/:id/finish` với `quizScore`, `quizTotal`
- [ ] **Kho báu** (`/child/rewards`): Gọi `GET /rewards/mine` + `PATCH /rewards/:id/claim`

---

## 🔒 Thao tác Authentication

### Gửi Bearer Token
Mọi request với icon 🔒 phải gửi kèm header:
```
Authorization: Bearer <access_token_from_supabase>
```
Token lấy từ: `supabase.auth.getSession()` → `session.access_token`

### Pagination
Tất cả GET list endpoints đều hỗ trợ:
```
?page=1&limit=20   (mặc định: page=1, limit=20, max limit=100)
```
Response format: `{ "data": [...], "total": <tổng số records> }`
