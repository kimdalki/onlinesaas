# 파트 검색 구현 계획

## 목표 설명
사이드바에 검색 기능을 구현하여, 메인 대시보드의 파트 목록을 파일 이름 기준으로 필터링합니다.

## 변경 제안

### [MODIFY] [Sidebar.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/components/Layout/Sidebar.tsx)
- `searchQuery`(검색어)와 `onSearchChange`(변경 핸들러) props를 추가합니다.
- 기존의 내부 `searchQuery` state를 제거하고, 상위에서 전달받은 props를 사용합니다.

### [MODIFY] [App.tsx](file:///e:/10_dev/02_onlinesaas/frontend/src/App.tsx)
- `searchQuery` state를 추가합니다.
- `searchQuery`와 `parts`를 기반으로 필터링된 목록인 `filteredParts`를 생성합니다.
- `Sidebar` 컴포넌트에 `searchQuery`와 `setSearchQuery`를 전달합니다.
- `PartCard` 목록을 렌더링할 때 `parts` 대신 `filteredParts`를 사용합니다.

## 검증 계획
1. 사이드바 검색창에 검색어를 입력합니다.
2. 파트 목록이 실시간으로 업데이트되어 일치하는 파일만 표시되는지 확인합니다.
3. 검색어를 지우면 모든 파트가 다시 표시되는지 확인합니다.
