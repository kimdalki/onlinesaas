# INDUSTECH/FABRICORE UI 적용 완료

레퍼런스 이미지를 기반으로 프론트엔드 UI를 완전히 재디자인했습니다.

## 변경된 파일

### 글로벌 스타일
- [index.css](file:///e:/10_dev/02_onlinesaas/frontend/src/index.css) - INDUSTECH 컬러 팔레트, 라이트 테마
- [App.css](file:///e:/10_dev/02_onlinesaas/frontend/src/App.css) - 파츠 갤러리 그리드 레이아웃

### 레이아웃 컴포넌트
- [Topbar.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Layout/Topbar.tsx) - 로고, 탭 네비게이션, 카트, 유저 메뉴
- [Topbar.css](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Layout/Topbar.css)
- [Sidebar.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Layout/Sidebar.tsx) - 검색, 폴더 트리, 링크
- [Sidebar.css](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Layout/Sidebar.css)

### 대시보드 컴포넌트
- [UploadCard.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Dashboard/UploadCard.tsx) - 점선 드롭존
- [UploadCard.css](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Dashboard/UploadCard.css)
- [PartCard.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Dashboard/PartCard.tsx) - 파트 카드 **(신규)**
- [PartCard.css](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Dashboard/PartCard.css) **(신규)**
- [PartReviewModal.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Dashboard/PartReviewModal.tsx) - 파트 리뷰 모달 **(신규)**
- [PartReviewModal.css](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Dashboard/PartReviewModal.css) **(신규)**

### 메인 앱
- [App.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/App.tsx) - 파츠 갤러리, 카트, 모달 통합

---

## 주요 기능

| 기능 | 설명 |
|------|------|
| **라이트 테마** | 다크 → 라이트 테마 전환, INDUSTECH 블루 (#1E5EFF) |
| **Topbar** | 로고 + PARTS/ORDERS/SAVED CARTS 탭 + 카트 아이콘 + 유저 메뉴 |
| **Sidebar** | 검색창, 폴더 트리, VIEW ALL DRAWINGS 버튼, 하단 링크 |
| **드롭존** | 점선 테두리, 아이콘, 지원 포맷 안내 |
| **파트 카드** | 썸네일, 파일명/치수, ADD TO CART 버튼, 액션 아이콘 |
| **Part Review 모달** | 단계 표시기, DXF 뷰어, 제조 가능성 분석, 파일 정보 |

---

## 검증 방법

개발 서버가 실행 중입니다:

```
http://localhost:5173/
```

### 확인 사항
1. 배경이 연한 회색 (`#F5F7FA`)인지 확인
2. 상단 네비게이션에 PANGEUM 로고와 탭이 보이는지 확인
3. 좌측 사이드바에 검색창, 폴더, 링크가 표시되는지 확인
4. 파란 점선 테두리 드롭존이 보이는지 확인
5. 파일 업로드 후 파트 카드가 생성되는지 확인
6. 카드 클릭 시 Part Review 모달이 열리는지 확인

> [!NOTE]
> 백엔드 서버도 실행해야 파일 업로드가 정상 동작합니다.
