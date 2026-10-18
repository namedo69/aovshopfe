# Kế hoạch Frontend — CSUC Shop

> Phiên bản: MVP 1.0  
> Cập nhật: 18/10/2026  
> Ưu tiên triển khai: Render Static Site  
> Backend thanh toán: SePay Webhook + VietQR

## 1. Mục tiêu

Frontend cung cấp hai khu vực trong cùng ứng dụng:

- Khu vực khách hàng: đăng ký, nạp tiền, chọn gói CSUC, đặt đơn và theo dõi đơn.
- Khu vực admin: dashboard, quản lý product, voucher, dòng tiền và đơn hàng.

Frontend không xử lý nghiệp vụ tài chính, không tự tính kết quả thanh toán và không gọi trực tiếp PMOD hoặc SePay bằng secret. Mọi quyết định cuối cùng đến từ backend.

## 2. Công nghệ đề xuất

| Thành phần | Lựa chọn |
|---|---|
| Framework | Vue 3 + Vite |
| Ngôn ngữ | TypeScript |
| Router | Vue Router |
| State | Pinia |
| API client | `fetch` wrapper hoặc Axios |
| Form validation | Zod + form library phù hợp |
| UI | Tailwind CSS hoặc component library thống nhất |
| Test unit/component | Vitest + Vue Test Utils |
| Test E2E | Playwright |
| Deploy | Render Static Site |

Khóa phiên bản Node bằng `.node-version` để local, CI và Render dùng cùng runtime.

## 3. Cấu trúc source

```text
frontend/
├── src/
│   ├── app/
│   ├── assets/
│   ├── components/
│   │   ├── common/
│   │   ├── customer/
│   │   └── admin/
│   ├── layouts/
│   ├── pages/
│   │   ├── auth/
│   │   ├── shop/
│   │   ├── wallet/
│   │   ├── orders/
│   │   └── admin/
│   ├── router/
│   ├── services/
│   ├── stores/
│   ├── composables/
│   ├── schemas/
│   ├── types/
│   └── utils/
├── public/
├── tests/
├── package.json
├── vite.config.ts
└── .node-version
```

Không tạo một store toàn cục khổng lồ. Tách `authStore`, `walletStore`, `cartStore`, `orderStore` và các store admin khi thật sự cần state dùng chung.

## 4. Sitemap

### 4.1. Khách chưa đăng nhập

- `/`: trang chủ/danh sách gói nổi bật.
- `/products`: danh sách gói.
- `/products/:slug`: chi tiết gói.
- `/login`: đăng nhập.
- `/register`: đăng ký.

### 4.2. Khách đã đăng nhập

- `/wallet`: số dư và lịch sử giao dịch.
- `/deposit`: tạo và theo dõi yêu cầu nạp.
- `/checkout`: kiểm tra gói, dữ liệu đầu vào và voucher.
- `/orders`: danh sách đơn.
- `/orders/:orderCode`: chi tiết và tiến trình đơn.
- `/profile`: thông tin tài khoản và phiên đăng nhập.

### 4.3. Admin

- `/admin`: dashboard.
- `/admin/products`: danh sách product.
- `/admin/products/new`: tạo product.
- `/admin/products/:id`: chỉnh sửa và provider mapping.
- `/admin/vouchers`: quản lý voucher.
- `/admin/orders`: quản lý đơn.
- `/admin/orders/:id`: chi tiết, lịch sử, provider request.
- `/admin/deposits`: quản lý giao dịch nạp.
- `/admin/reports/cashflow`: thống kê dòng tiền.

## 5. Layout và điều hướng

### Customer layout

- Header: logo, product, số dư, đơn hàng, tài khoản.
- Mobile navigation rõ ràng, ưu tiên nạp tiền và lịch sử đơn.
- Footer: điều khoản, hỗ trợ, trạng thái hệ thống.

### Admin layout

- Sidebar theo module.
- Header hiển thị môi trường `staging/production` để tránh thao tác nhầm.
- Breadcrumb và khu vực action cố định.
- Những action nguy hiểm như hoàn tiền, gửi lại đơn cần modal xác nhận có nội dung cụ thể.

## 6. Luồng khách hàng

### 6.1. Đăng ký/đăng nhập

1. Validate email, mật khẩu và xác nhận mật khẩu tại client.
2. Submit một lần; disable nút trong thời gian request.
3. Hiển thị lỗi field từ backend.
4. Access token giữ trong memory/store; refresh bằng cookie HttpOnly.
5. Khi refresh thất bại, xóa state và chuyển về login kèm return URL.

Không lưu refresh token hoặc API secret trong `localStorage`.

### 6.2. Chọn product/gói CSUC

Danh sách hỗ trợ:

- Tìm kiếm, lọc category.
- Hiển thị giá gốc/giá bán, trạng thái hoạt động.
- Skeleton khi tải và empty state khi không có dữ liệu.
- Product detail render form động theo `input_schema` từ backend.

Ví dụ `input_schema` có thể tạo các field:

- Link hoặc ID mục tiêu.
- Số lượng.
- Ghi chú.
- Lựa chọn dịch vụ con nếu product cho phép.

Client chỉ validate để cải thiện UX; backend vẫn validate lại hoàn toàn.

### 6.3. Nạp tiền SePay

```text
Nhập số tiền
→ POST /deposits
→ Hiển thị QR + tài khoản + số tiền + nội dung
→ Poll trạng thái deposit
→ completed: cập nhật số dư và hiển thị thành công
→ expired/failed: dừng poll và cho tạo yêu cầu mới
```

Màn hình nạp tiền cần:

- Các mức tiền gợi ý và ô nhập tùy chỉnh.
- Hiển thị chính xác số tiền do backend trả về.
- QR VietQR.
- Nút sao chép số tài khoản và nội dung chuyển khoản.
- Đồng hồ đếm thời hạn.
- Cảnh báo không sửa số tiền hoặc nội dung.
- Trạng thái `pending`, `completed`, `expired`, `failed`.
- Link xem lịch sử nạp.

Polling đề xuất:

- Poll sau mỗi 3–5 giây khi tab đang active.
- Tăng khoảng cách hoặc tạm dừng khi tab background.
- Dừng khi trạng thái terminal hoặc component unmount.
- Khi mạng lỗi, retry có giới hạn; không tự kết luận thanh toán thất bại.
- Sau `completed`, gọi lại `/wallet` thay vì tự cộng số dư ở client.

Frontend không được đánh dấu thanh toán thành công dựa vào việc người dùng bấm “Tôi đã chuyển tiền”. Chỉ trạng thái từ backend/webhook SePay có giá trị.

### 6.4. Checkout

1. Khách chọn product và nhập dữ liệu yêu cầu.
2. Frontend hiển thị giá tham khảo.
3. Gọi API validate voucher khi khách áp mã.
4. Trang xác nhận hiển thị số dư và tổng do backend cung cấp.
5. Gửi `POST /orders` kèm `Idempotency-Key` do client sinh cho một lần checkout.
6. Disable nút đặt đơn cho đến khi request hoàn tất.
7. Khi timeout, tra cứu theo idempotency key/order code trước khi cho phép gửi lại.
8. Thành công chuyển sang trang chi tiết đơn.

Không gửi giá bán đã tính như nguồn dữ liệu đáng tin cậy. Request chỉ gửi product ID, quantity, customer input, voucher code và customer note.

### 6.5. Theo dõi đơn

Timeline trạng thái:

- `queued`: đã thanh toán, chờ gửi.
- `sending`: đang gửi sang nhà cung cấp.
- `processing`: nhà cung cấp đang xử lý.
- `completed`: hoàn thành.
- `failed`: cần xử lý.
- `refunded`: đã hoàn tiền.
- `cancelled`: đã hủy trước xử lý.

Trang chi tiết hiển thị:

- Order code, thời gian và tổng tiền.
- Product snapshot và dữ liệu khách nhập đã được che nếu nhạy cảm.
- Voucher/discount.
- Timeline trạng thái.
- Kết quả trả về của dịch vụ nếu được phép công khai.
- Trạng thái hoàn tiền.

## 7. Luồng admin

### 7.1. Dashboard

Cards:

- Tổng đơn theo khoảng thời gian.
- Đơn chờ, đang xử lý, hoàn thành và lỗi.
- Tổng tiền nạp.
- Doanh thu đơn hoàn thành.
- Tổng hoàn tiền.

Biểu đồ và bảng phải dùng cùng timezone do backend quy định. Filter ngày được serialize rõ `start`/`end`; không tự cộng trừ timezone tại nhiều component.

### 7.2. Quản lý product

- Danh sách có search, category và trạng thái.
- Form tạo/sửa product.
- Builder đơn giản cho `input_schema`.
- Cấu hình provider và external service ID.
- Preview form khách sẽ nhìn thấy.
- Soft-disable product thay vì xóa nếu đã có đơn lịch sử.
- Cảnh báo khi product active nhưng chưa có provider mapping.

### 7.3. Quản lý voucher

- Tạo fixed/percent voucher.
- Thời gian bắt đầu/kết thúc.
- Đơn tối thiểu, giảm tối đa.
- Tổng lượt dùng và lượt dùng mỗi khách.
- Product áp dụng.
- Trạng thái và số lượt đã dùng.

Form cần validate các trường phụ thuộc, ví dụ percent không vượt 100 và ngày kết thúc phải sau ngày bắt đầu.

### 7.4. Quản lý đơn

- Filter trạng thái, provider, product, khách hàng và khoảng ngày.
- Search order code/provider order ID.
- Bảng phân trang từ server.
- Trang chi tiết có order items, customer input, ledger, status history và provider attempts.
- Action được backend trả về dưới dạng `allowed_actions` nếu có thể.
- Retry provider, refund và cập nhật trạng thái phải có confirmation.
- Sau action, refetch toàn bộ chi tiết đơn; không tự sửa state theo giả định.

### 7.5. Dòng tiền và deposit

- Bảng deposits và wallet transactions là hai tab riêng.
- Cho phép tra SePay transaction ID, payment code, user và trạng thái.
- Duyệt thủ công phải hiển thị cảnh báo đối soát và yêu cầu lý do.
- Không cung cấp nút xóa giao dịch tài chính đã hoàn thành.
- Export CSV là hạng mục sau MVP nếu chưa cần ngay.

## 8. API client

Tạo một client duy nhất chịu trách nhiệm:

- `baseURL` lấy từ `VITE_API_BASE_URL`.
- Gắn access token và `X-Request-ID` nếu cần.
- `credentials: "include"` cho refresh cookie.
- Refresh token một lần khi nhận 401; khóa các request đồng thời để tránh refresh storm.
- Parse error format chuẩn.
- Abort request khi route/component đã rời đi.
- Không log token hoặc payload nhạy cảm.

Các type response nên được tạo từ OpenAPI hoặc dùng schema runtime để tránh frontend/backend lệch contract.

## 9. State management

### `authStore`

- User hiện tại, role, access token trong memory.
- `bootstrap`, `login`, `logout`, `refresh`.

### `walletStore`

- Số dư hiện tại và thời điểm tải cuối.
- Chỉ cập nhật từ response backend.

### `cartStore`

- Product selection và input chưa submit.
- Có thể lưu draft không nhạy cảm vào session storage.
- Không lưu giá như nguồn sự thật.

### `orderStore`

- Cache ngắn hạn cho order detail/list.
- Poll đơn đang `queued/sending/processing`, dừng khi terminal.

Server-side pagination/filter nên nằm trong URL query để có thể reload hoặc chia sẻ link admin.

## 10. UX cho lỗi và trạng thái bất đồng bộ

Mọi trang dữ liệu có đủ bốn trạng thái:

- Loading.
- Success.
- Empty.
- Error có nút retry.

Các lỗi nghiệp vụ cần thông báo cụ thể:

- `INSUFFICIENT_BALANCE`: đưa link sang trang nạp.
- `VOUCHER_INVALID`: giữ form và chỉ xóa kết quả giảm giá.
- `PRODUCT_UNAVAILABLE`: refetch product.
- `ORDER_ALREADY_EXISTS`: điều hướng tới đơn đã tạo.
- `PROVIDER_TEMPORARY_ERROR`: đơn vẫn tồn tại, giải thích đang chờ xử lý.

Không hiện thông báo “đặt đơn thất bại” chỉ vì request timeout; cần kiểm tra lại trạng thái bằng idempotency key.

## 11. Bảo mật frontend

- Không đưa SePay secret, PMOD key, JWT secret vào biến `VITE_*`.
- Mọi biến `VITE_*` đều được coi là công khai vì được bundle vào JavaScript.
- Escape/sanitize nội dung động; không dùng `v-html` với dữ liệu chưa tin cậy.
- Route guard chỉ phục vụ UX; backend vẫn là nơi kiểm tra quyền.
- Không hiển thị nguyên credential hoặc dữ liệu nhạy cảm của khách trong bảng admin.
- Confirmation dialog phải nói rõ order, số tiền và tác động.
- Thiết lập CSP và các security headers tại Render nếu phù hợp.

## 12. Responsive và accessibility

- Mobile-first cho luồng product, nạp tiền và xem đơn.
- Bảng admin có chế độ scroll hoặc card view trên màn hình nhỏ.
- Tất cả input có label và lỗi gắn với field.
- Điều hướng được bằng bàn phím.
- Modal giữ focus và trả focus về nút mở khi đóng.
- Màu trạng thái không phải tín hiệu duy nhất; luôn có text/icon.
- Kiểm tra contrast và trạng thái loading cho screen reader.

## 13. Deploy lên Render Static Site

### 13.1. Thiết lập

| Thiết lập | Giá trị đề xuất |
|---|---|
| Service type | Static Site |
| Root Directory | `frontend` nếu dùng monorepo |
| Build Command | `npm ci && npm run build` |
| Publish Directory | `dist` |
| Auto Deploy | Bật cho branch production |

Biến môi trường build:

```dotenv
VITE_API_BASE_URL=https://api.example.com/api/v1
VITE_APP_NAME=CSUC Shop
VITE_APP_ENV=production
```

Không có secret trong các biến trên.

### 13.2. SPA routing

Cấu hình rewrite mọi đường dẫn ứng dụng chưa khớp file tĩnh về `/index.html`, nếu không refresh trực tiếp `/orders/...` hoặc `/admin/...` sẽ trả 404.

Không rewrite asset/API path sai sang `index.html`; API dùng domain backend riêng.

### 13.3. Domain và CORS

Đề xuất:

- Frontend: `https://app.example.com` hoặc `https://example.com`.
- Backend: `https://api.example.com`.
- Backend CORS chỉ allow đúng frontend origin.
- Test cookie `Secure`, `SameSite`, refresh session và CSRF sau khi gắn custom domain.

### 13.4. Preview/staging

- Tạo Static Site staging hoặc preview environment trỏ đến staging API.
- Banner rõ ràng khi `VITE_APP_ENV=staging`.
- Không để staging frontend gọi production API.

## 14. Kiểm thử

### Unit/component

- Format tiền VNĐ.
- Form product động từ `input_schema`.
- Voucher states.
- Deposit countdown và polling cleanup.
- Order timeline và allowed actions.

### E2E

- Đăng ký/đăng nhập/refresh/logout.
- Tạo deposit và chuyển từ pending sang completed qua mock webhook backend.
- Checkout với đủ tiền, thiếu tiền và double-click.
- Voucher hợp lệ, hết hạn, hết lượt.
- Admin lọc đơn, retry và refund.
- Refresh trực tiếp mọi route quan trọng sau khi deploy Render.

### Trình duyệt và thiết bị

- Chrome/Edge phiên bản hiện hành.
- Safari iOS và Chrome Android cho luồng QR/nạp tiền.
- Kiểm tra copy nội dung chuyển khoản trên mobile.

## 15. Lộ trình thực hiện

### Sprint 1 — Foundation và deploy skeleton

- Vite/Vue/TypeScript, router, layouts, API client.
- Auth store và route guards.
- Render Static Site staging + SPA rewrite.

### Sprint 2 — Product và auth UI

- Register/login.
- Product list/detail và dynamic input form.
- Admin product CRUD.

### Sprint 3 — Wallet và SePay UI

- Wallet summary/history.
- Deposit form, QR, copy buttons, countdown, polling.
- Admin deposits.

### Sprint 4 — Checkout và orders

- Voucher, checkout confirmation, idempotency.
- Order list/detail/timeline.
- Các trạng thái timeout và retry UX.

### Sprint 5 — Admin operations

- Dashboard, order filters/detail.
- Retry provider, refund, status history.
- Voucher management và cashflow reports.

### Sprint 6 — Hardening và production

- E2E, responsive, accessibility.
- Error tracking, analytics tối thiểu.
- Custom domain, CORS/cookie test và production deploy.

## 16. Điều kiện hoàn thành MVP

- Khách hoàn thành được toàn bộ luồng đăng ký → nạp → chọn gói → đặt đơn → theo dõi.
- Frontend không chứa secret và không tự quyết định trạng thái thanh toán.
- Double-click checkout không tạo hai đơn.
- Polling deposit/order được dừng đúng lúc và không rò timer.
- Admin thao tác được trên mobile cơ bản nhưng tối ưu cho desktop.
- Refresh trực tiếp route SPA không bị 404 trên Render.
- Loading, empty, error và permission-denied đều có giao diện rõ ràng.

## 17. Tài liệu tham chiếu

- Render Static Site và loại dịch vụ: https://render.com/docs/your-first-deploy
- Render environment variables: https://render.com/docs/configure-environment-variables
- Render Web Services/CORS domain context: https://render.com/docs/web-services
- SePay Developer: https://developer.sepay.vn/vi
- SePay tạo webhook: https://developer.sepay.vn/vi/sepay-webhooks/tao-webhook
- SePay tích hợp webhook: https://developer.sepay.vn/vi/sepay-webhooks/tich-hop-webhook


