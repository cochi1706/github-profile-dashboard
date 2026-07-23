# GitHub Profile Dashboard

Dashboard React + Vite hiển thị tổng quan các repository công khai của một tài khoản GitHub. Dữ liệu được lấy định kỳ bằng GitHub Actions, tổng hợp thành file JSON tĩnh rồi frontend mới đọc file đó. Token không bao giờ được gửi xuống trình duyệt.

## Bắt đầu nhanh

```bash
npm install
cp .env.example .env
# điền GH_USERNAME và GH_TOKEN trong .env
npm run data:fetch:local
npm run dev
```

Mở địa chỉ Vite hiển thị trong terminal. Nếu chưa chạy `data:fetch`, giao diện sẽ dùng bộ dữ liệu mẫu được commit sẵn.

## GitHub Secrets

Trong repository, mở **Settings → Secrets and variables → Actions → New repository secret** rồi tạo secret `GH_USERNAME` với username GitHub cần theo dõi. Tên secret không được bắt đầu bằng `GITHUB_`; token workflow cũng không nên giữ dưới tên mặc định. Workflow mặc định cấp tự động đã được GitHub cung cấp dưới khóa `GH_TOKEN` thông qua biến môi trường; bạn có thể ánh xạ sang một Personal Access Token đọc metadata công khai bằng cách tạo secret `GH_PAT` rồi đổi mapping trong workflow thành `GH_TOKEN: ${{ secrets.GH_PAT }}`. Token local trong `.env` cũng chỉ được đọc ở script data pipeline.

Workflow `.github/workflows/update-github-stats.yml` chạy khi push lên `main`, theo lịch hằng ngày và theo yêu cầu thủ công. Nó gọi endpoint `/users/{username}/repos` của GitHub (endpoint này trả về repository public của user), cập nhật `src/data/github-stats.json`, sau đó commit dữ liệu đã tổng hợp.

## Lệnh thường dùng

```bash
npm run dev        # chạy development server
npm run build      # kiểm tra TypeScript và build production
npm run lint       # chạy ESLint
npm run test:run   # chạy test một lần
npm test           # chạy Vitest ở watch mode
npm run data:fetch       # lấy dữ liệu khi biến môi trường đã được export
npm run data:fetch:local # nạp biến từ .env rồi lấy dữ liệu
```

## Kiến trúc

`src/App.tsx` là lớp trình bày chính: đọc snapshot JSON, tính bộ lọc/sắp xếp trong bộ nhớ và render KPI cards, biểu đồ Recharts cùng bảng repository. Các kiểu dữ liệu dùng chung nằm trong `src/types.ts`; phép tính định dạng và phân phối ngôn ngữ nằm trong `src/lib/stats.ts` để có thể test độc lập.

`scripts/fetch-github-stats.mjs` là data pipeline chạy ngoài trình duyệt. Script gọi endpoint user/repositories và endpoint languages cho từng repository, tính tổng stars, forks, issues, bytes ngôn ngữ rồi ghi snapshot có thể commit. `.github/workflows/update-github-stats.yml` là lớp tự động hóa duy nhất chạm vào secret.

`src/data/github-stats.json` là dữ liệu runtime được frontend import. Đây là snapshot public, không phải nơi lưu credential. Khi muốn thay nguồn dữ liệu hoặc thêm chỉ số, cập nhật type, script pipeline, rồi nối trường mới vào UI.
