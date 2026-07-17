# Bot Flow Builder

Bot Flow Builder là MVP SPA cho phép thiết kế kịch bản chatbot bằng cách kéo thả node, nối node trên canvas, cấu hình từng node và xuất flow thành JSON.

## Tính năng

- Kéo 5 loại node vào canvas: Start, Message, Condition, API Request, End.
- Di chuyển, chọn, kết nối và xóa node/edge.
- Kéo resize node trực tiếp trên canvas khi node đang được chọn.
- Condition node có hai nhánh riêng: True và False.
- Properties panel cập nhật cấu hình node trực tiếp.
- Validate flow trước khi build JSON.
- Preview JSON đã format, copy vào clipboard và tải file `.json`.
- Tự lưu flow name, nodes và edges vào `localStorage`.

## Công nghệ

- React, TypeScript strict mode, Vite.
- Tailwind CSS.
- React Flow (`@xyflow/react`).
- ESLint và Prettier.
- Lucide React icons.

## Yêu cầu môi trường

- Node.js 20+ khuyến nghị.
- npm 10+ khuyến nghị.

## Cài đặt và chạy local

```bash
npm install
npm run dev
```

## Build production

```bash
npm run build
npm run preview
```

## Kiểm tra lint

```bash
npm run lint
```

## Cấu trúc thư mục

```text
src/
├── components/
│   ├── common/
│   ├── flow/
│   └── nodes/
├── features/
│   └── flow-builder/
├── hooks/
├── pages/
├── App.tsx
├── main.tsx
└── index.css
```

## Các loại node

- Start: điểm bắt đầu flow, không có input, một output, tối đa một node.
- Message: bot gửi tin nhắn, hỗ trợ biến dạng `{{variableName}}`.
- Condition: kiểm tra điều kiện với toán tử `equals`, `not_equals`, `contains`, `greater_than`, `less_than`.
- API Request: mô tả API call với method, URL, body và biến lưu response.
- End: kết thúc một nhánh, có input và không có output.

## JSON output

JSON build ra gồm `version`, thông tin `flow`, danh sách runtime `nodes`, `connections` và phần `editor.nodes` để lưu vị trí/kích thước node khi mở lại editor.

## Validation

Ứng dụng kiểm tra:

- Flow phải có tên.
- Có đúng một Start node và ít nhất một End node.
- Start phải nối tới node khác.
- Message phải có nội dung.
- Condition phải đủ variable, operator, value và có cả nhánh True/False.
- API Request phải có URL hợp lệ.
- Body của POST, PUT, PATCH phải là JSON hợp lệ nếu không rỗng.
- Edge không được tự nối, không trỏ tới node không tồn tại.
- Cảnh báo node không thể đi tới từ Start hoặc không thể dẫn tới End.

