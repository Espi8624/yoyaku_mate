# 3만 엔의 교훈: Google Maps API 무한 루프 과금 사태

> 작성일: 2026-07-10  
> 관련 파일: [`WaitingPlaceMap.jsx`](../../src/containers/waiting-screen/waiting-screen/WaitingPlaceMap.jsx)

## 문제 상황 (Incident)

개발 과정 중, 손님 대기 화면에서 주변 추천 장소를 보여주는 지도를 띄웠는데 하룻밤 사이에 **Google Maps API 청구서에 약 3만 엔(30,000¥)** 의 엄청난 요금이 발생한 대형 사고가 있었습니다.

원인은 React의 `useEffect` 의존성 배열 관리 실수로 인한 **API 무한 호출(Infinite Loop)** 이었습니다.

---

## 원인 분석

`WaitingPlaceMap.jsx`에는 두 가지 주요 API 호출이 있었습니다.
1. `Geocoder.geocode()`: 점포 주소를 위도/경도로 변환
2. `Place.searchNearby()`: 점포 주변의 카테고리별 장소 검색 (과금 단가가 매우 높음)

### 예전의 잘못된 코드 패턴 (무한 루프 발생 조건)

```javascript
useEffect(() => {
    // 문제점 1: 탈출 조건 부족
    if (isLoaded && storeInfo && storeInfo.address) {
        geocoder.geocode({ address: storeInfo.address }, (results, status) => {
            const newCenter = { lat: location.lat(), lng: location.lng() };
            // 문제점 2: 상태 업데이트가 useEffect를 다시 트리거함
            setStoreLocation(newCenter);
        });
    }
}, [isLoaded, storeInfo, storeLocation]); // storeLocation이 계속 바뀌면서 무한 루프!
```

1. `useEffect` 실행 → API 호출
2. 응답받은 데이터로 `setStoreLocation()` 상태 업데이트
3. 상태가 변경되었으므로 컴포넌트 리렌더링
4. `storeLocation` 값이 변경(새로운 객체 참조)되었으므로 `useEffect` 재실행
5. **(1번으로 돌아가서 1초에 수십 번씩 비싼 API 무한 호출)**

---

## 해결 및 방어 로직 (현재 코드)

이 끔찍한 사태를 겪은 후, 현재 코드에는 API 과금을 방어하기 위한 3중 안전장치가 적용되어 있습니다.

### 1. 확실한 실행 탈출 조건 (Guard Clause)
이미 좌표를 가져왔다면 더 이상 Geocoder API를 호출하지 않도록 `!storeLocation` 조건을 추가했습니다.
```javascript
// storeLocation이 null 일 때만 최초 1회 실행
if (isLoaded && storeInfo && storeInfo.address && !storeLocation) { ... }
```

### 2. useRef를 활용한 API 응답 메모리 캐싱
가장 비싼 `Place.searchNearby()` 호출 시, 탭(카테고리)을 이동할 때마다 API를 쏘지 않도록 `useRef` 변수에 결과를 저장합니다.
```javascript
const placesCache = useRef({});

// 이미 캐시에 데이터가 있으면 API를 호출하지 않고 캐시 반환
if (placesCache.current[activeCategory]) {
    setNearbyPlaces(placesCache.current[activeCategory]);
    return;
}

// API 호출 후 결과 캐싱
placesCache.current[activeCategory] = mappedPlaces;
```

### 3. 레이스 컨디션 (Race Condition) 방어
빠르게 카테고리 탭을 연타했을 때, 이전 요청들이 뒤늦게 도착해 상태를 덮어씌우는 것을 막기 위해 `fetchRequestId` 가드를 추가했습니다.
```javascript
const currentRequestId = ++fetchRequestId.current;
// ... API 통신 ...
if (currentRequestId !== fetchRequestId.current) return; // 최신 요청이 아니면 버림
```

---

## Lessons Learned

- **외부 API 호출은 useEffect 안에서 다룰 때 극도로 주의해야 합니다.** 상태 업데이트(`setState`)가 해당 `useEffect`를 다시 트리거하지 않는지 항상 의심해야 합니다.
- 유료 API 연동 테스트를 할 때는 반드시 **구글 클라우드 콘솔에서 일일 사용량 할당량(Quota) 제한**을 낮게 설정해 두어 요금 폭탄을 미연에 방지해야 합니다.
