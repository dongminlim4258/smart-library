let globalLibraryBooks = [];
let kakaoMap = null; 
let currentInfoWindow = null; 

window.onload = function() {
    initDatabase();
    setupSearch();
    setupNavigation(); 
};

// 1. 도서 데이터 로드 프로세서
function initDatabase() {
    const dataSources = [
        { name: '불광역', raw: typeof bulgwangCSV !== 'undefined' ? bulgwangCSV : "" },
        { name: '시청역', raw: typeof cityhallCSV !== 'undefined' ? cityhallCSV : "" },
        { name: '역촌역', raw: typeof yeokchonCSV !== 'undefined' ? yeokchonCSV : "" },
        { name: '연신내역', raw: typeof yeonsinnaeCSV !== 'undefined' ? yeonsinnaeCSV : "" },
        { name: '합정역', raw: typeof hapjeongCSV !== 'undefined' ? hapjeongCSV : "" }
    ];

    globalLibraryBooks = [];
    dataSources.forEach(source => {
        if (!source.raw || !source.raw.trim()) return;
        const lines = source.raw.split(/\r?\n/);
        if (lines.length < 2) return;
        const headers = lines[0].split('\t');
        const tIdx = headers.findIndex(h => h.trim().includes('도서명'));
        const aIdx = headers.findIndex(h => h.trim().includes('저자'));
        const pIdx = headers.findIndex(h => h.trim().includes('출판사'));
        const iIdx = headers.findIndex(h => h.trim().includes('ISBN'));

        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const row = lines[i].split('\t');
            const cleanText = (val) => val ? val.replace(/"/g, '').trim() : "";
            const title = tIdx !== -1 && row[tIdx] ? cleanText(row[tIdx]) : "";
            const author = aIdx !== -1 && row[aIdx] ? cleanText(row[aIdx]) : "저자 미상";
            const publisher = pIdx !== -1 && row[pIdx] ? cleanText(row[pIdx]) : "출판사 미상";
            const isbn = iIdx !== -1 && row[iIdx] ? cleanText(row[iIdx]) : "확인불가";
            if (title && title !== "도서명") {
                globalLibraryBooks.push({ title, author, publisher, isbn, location: source.name });
            }
        }
    });

    const hero = document.querySelector('.main-hero');
    if (hero) {
        const oldStatus = document.getElementById('db-status-tag');
        if (oldStatus) oldStatus.remove();
        const statusDiv = document.createElement('div');
        statusDiv.id = 'db-status-tag';
        statusDiv.style.cssText = "margin-top:10px; font-size:0.9rem; color:#2ed573; font-weight:bold;";
        if (globalLibraryBooks.length > 0) {
            statusDiv.innerHTML = ``;
        } else {
            statusDiv.innerHTML = `🔴 데이터 동기화 실패. 파일을 점검하세요.`;
            statusDiv.style.color = "#ff4757";
        }
        hero.appendChild(statusDiv);
    }
}

// 2. 내비게이션 라우팅 컨트롤러
function setupNavigation() {
    const goToMapBtn = document.getElementById('go-to-map-btn');
    const backButtons = document.querySelectorAll('.back-btn');

    if(goToMapBtn) {
        goToMapBtn.onclick = function() {
            document.getElementById('main-dashboard-page').style.display = 'none';
            document.getElementById('map-page').style.display = 'block';
            initKakaoMap(); 
        };
    }

    backButtons.forEach(btn => {
        btn.onclick = function() {
            document.getElementById('search-results-page').style.display = 'none';
            document.getElementById('map-page').style.display = 'none';
            document.getElementById('main-dashboard-page').style.display = 'block';
        };
    });
}

// 3. 🗺️ 84개 스마트도서관 및 길찾기 통합 맵 모델링
function initKakaoMap() {
    const container = document.getElementById('library-map-container');
    const options = {
        center: new kakao.maps.LatLng(37.5665, 126.9780), 
        level: 7
    };

    if (!kakaoMap) {
        kakaoMap = new kakao.maps.Map(container, options);
    }

    const locations = [
  { line: "3호선", name: "수서", count: 1, operator: "강남구청", lat: 37.487507, lng: 127.101324 },
  { line: "7호선", name: "청담", count: 1, operator: "강남구청", lat: 37.519097, lng: 127.051851 },
  { line: "3호선", name: "압구정", count: 1, operator: "강남구청", lat: 37.526169, lng: 127.028502 },
  { line: "8호선", name: "천호", count: 1, operator: "강동문화재단", lat: 37.53792, lng: 127.123179 },
  { line: "5호선", name: "상일동", count: 1, operator: "강동문화재단", lat: 37.556714, lng: 127.166381 },
  { line: "5호선", name: "고덕", count: 1, operator: "강동문화재단", lat: 37.555002, lng: 127.154214 },
  { line: "4호선", name: "수유", count: 1, operator: "강북구청", lat: 37.637127, lng: 127.024731 },
  { line: "4호선", name: "미아", count: 1, operator: "강북구청", lat: 37.626435, lng: 127.026151 },
  { line: "4호선", name: "미아사거리", count: 1, operator: "강북구청", lat: 37.613276, lng: 127.030083 },
  { line: "5호선", name: "마곡", count: 1, operator: "강서구청", lat: 37.562182, lng: 126.82693 },
  { line: "5호선", name: "우장산", count: 1, operator: "강서구청", lat: 37.548864, lng: 126.83633 },
  { line: "5호선", name: "까치산", count: 1, operator: "강서구청", lat: 37.53181, lng: 126.846706 },
  { line: "2호선", name: "서울대입구", count: 1, operator: "관악구청", lat: 37.481233, lng: 126.952745 },
  { line: "2호선", name: "신대방", count: 1, operator: "관악구청", lat: 37.487534, lng: 126.913279 },
  { line: "2호선", name: "봉천", count: 1, operator: "관악구청", lat: 37.482416, lng: 126.941896 },
  { line: "2호선", name: "낙성대", count: 1, operator: "관악구청", lat: 37.47693, lng: 126.963783 },
  { line: "2호선", name: "신림", count: 1, operator: "관악구청", lat: 37.484216, lng: 126.929573 },
  { line: "5호선", name: "군자", count: 1, operator: "광진구청", lat: 37.557102, lng: 127.079559 },
  { line: "2호선", name: "구의", count: 1, operator: "광진구청", lat: 37.536857, lng: 127.085024 },
  { line: "7호선", name: "천왕", count: 1, operator: "구로구청", lat: 37.486699, lng: 126.838684 },
  { line: "7호선", name: "온수(성공회대입구)", count: 1, operator: "구로구청", lat: 37.492059, lng: 126.823294 },
  { line: "2호선", name: "대림", count: 1, operator: "구로도서관", lat: 37.492426, lng: 126.895293 },
  { line: "6호선", name: "디지털미디어시티", count: 1, operator: "구립증산정보도서관", lat: 37.577005, lng: 126.898643 },
  { line: "7호선", name: "가산디지털단지역", count: 1, operator: "금천구청", lat: 37.480376, lng: 126.882704 },
  { line: "7호선", name: "노원", count: 1, operator: "노원구청", lat: 37.654478, lng: 127.060555 },
  { line: "7호선", name: "하계", count: 1, operator: "노원구청", lat: 37.636363, lng: 127.067999 },
  { line: "3호선", name: "쌍문", count: 1, operator: "도봉구청", lat: 37.648274, lng: 127.034381 },
  { line: "2호선", name: "용두", count: 1, operator: "동대문구청", lat: 37.574012, lng: 127.03811 },
  { line: "5호선", name: "답십리", count: 1, operator: "동대문구청", lat: 37.566833, lng: 127.05266 },
  { line: "4호선", name: "총신대입구", count: 1, operator: "동작구청", lat: 37.487521, lng: 126.982309 },
  { line: "7호선", name: "장승배기역", count: 1, operator: "동작구청", lat: 37.504845, lng: 126.939025 },
  { line: "7호선", name: "신대방삼거리역", count: 1, operator: "동작구청", lat: 37.499717, lng: 126.928218 },
  { line: "6호선", name: "합정", count: 1, operator: "마포중앙도서관", lat: 37.549033, lng: 126.913546 },
  { line: "2호선", name: "아현", count: 1, operator: "서대문구청", lat: 37.557407, lng: 126.956079 },
  { line: "3호선", name: "독립문", count: 1, operator: "서대문구청", lat: 37.574534, lng: 126.957902 },
  { line: "3호선", name: "홍제", count: 1, operator: "서대문도서관", lat: 37.588851, lng: 126.944092 },
  { line: "5호선", name: "서대문", count: 1, operator: "서대문도서관", lat: 37.565812, lng: 126.966639 },
  { line: "2호선", name: "시청", count: 1, operator: "서울특별시 서울도서관", lat: 37.56359, lng: 126.975407 },
  { line: "5호선", name: "길동", count: 1, operator: "서울특별시교육청강동도서관", lat: 37.538022, lng: 127.140085 },
  { line: "5호선", name: "공덕", count: 1, operator: "서울특별시교육청마포평생학습관", lat: 37.544005, lng: 126.951058 },
  { line: "5호선", name: "개롱", count: 1, operator: "서울특별시교육청송파도서관", lat: 37.498097, lng: 127.134817 },
  { line: "3호선", name: "경복궁", count: 1, operator: "서울특별시교육청종로도서관", lat: 37.575844, lng: 126.973576 },
  { line: "3호선", name: "양재", count: 1, operator: "서초구청", lat: 37.48466, lng: 127.03513 },
  { line: "7호선", name: "내방", count: 1, operator: "서초구청", lat: 37.48764, lng: 126.993541 },
  { line: "3호선", name: "금호", count: 1, operator: "성동구청", lat: 37.548269, lng: 127.015785 },
  { line: "3호선", name: "옥수", count: 1, operator: "성동구청", lat: 37.541653, lng: 127.017303 },
  { line: "2호선", name: "상왕십리", count: 1, operator: "성동구청", lat: 37.564504, lng: 127.028872 },
  { line: "2호선", name: "성수", count: 1, operator: "성동구청", lat: 37.544628, lng: 127.055983 },
  { line: "5호선", name: "마장", count: 1, operator: "성동구청", lat: 37.566066, lng: 127.042921 },
  { line: "3호선", name: "옥수", count: 1, operator: "성동문화재단", lat: 37.541653, lng: 127.017303 },
  { line: "5호선", name: "방이", count: 1, operator: "송파구청", lat: 37.508752, lng: 127.126054 },
  { line: "5호선", name: "마천", count: 1, operator: "송파구청", lat: 37.494972, lng: 127.152784 },
  { line: "5호선", name: "거여", count: 1, operator: "송파구청", lat: 37.493208, lng: 127.143983 },
  { line: "8호선", name: "장지", count: 2, operator: "송파구청", lat: 37.478609, lng: 127.126229 },
  { line: "5호선", name: "목동", count: 1, operator: "양천구청", lat: 37.526088, lng: 126.864296 },
  { line: "5호선", name: "오목교", count: 1, operator: "양천구청", lat: 37.524557, lng: 126.875049 },
  { line: "2호선", name: "신정네거리", count: 1, operator: "양천구청", lat: 37.520218, lng: 126.852849 },
  { line: "5호선", name: "여의도", count: 1, operator: "영등포구청", lat: 37.521578, lng: 126.924318 },
  { line: "5호선", name: "양평", count: 1, operator: "영등포구청", lat: 37.525614, lng: 126.886177 },
  { line: "3호선", name: "불광", count: 1, operator: "은평구립도서관", lat: 37.610554, lng: 126.929843 },
  { line: "3호선", name: "연신내", count: 1, operator: "은평구립도서관", lat: 37.618855, lng: 126.920859 },
  { line: "6호선", name: "역촌", count: 1, operator: "은평구립도서관", lat: 37.60605, lng: 126.922764 },
  { line: "3호선", name: "녹번", count: 1, operator: "은평구립도서관", lat: 37.600882, lng: 126.935758 },
  { line: "3호선", name: "구파발", count: 1, operator: "은평구립도서관", lat: 37.636612, lng: 126.918827 },
  { line: "6호선", name: "응암", count: 1, operator: "은평구립도서관", lat: 37.59859, lng: 126.915583 },
  { line: "6호선", name: "고려대", count: 1, operator: "재단법인 성북문화재단", lat: 37.59034, lng: 127.03626 },
  { line: "6호선", name: "석계", count: 1, operator: "재단법인 성북문화재단", lat: 37.614937, lng: 127.065922 },
  { line: "6호선", name: "보문", count: 1, operator: "재단법인 성북문화재단", lat: 37.585293, lng: 127.019377 },
  { line: "6호선", name: "안암", count: 1, operator: "재단법인 성북문화재단", lat: 37.586261, lng: 127.02903 },
  { line: "6호선", name: "월곡", count: 1, operator: "재단법인 성북문화재단", lat: 37.60192, lng: 127.041492 },
  { line: "6호선", name: "돌곶이", count: 1, operator: "재단법인 성북문화재단", lat: 37.610522, lng: 127.056419 },
  { line: "4호선", name: "길음", count: 1, operator: "재단법인 성북문화재단", lat: 37.604087, lng: 127.025353 },
  { line: "4호선", name: "성신여대", count: 1, operator: "재단법인 성북문화재단", lat: 37.592782, lng: 127.017338 },
  { line: "4호선", name: "한성대입구", count: 1, operator: "재단법인 성북문화재단", lat: 37.58838, lng: 127.006751 },
  { line: "3호선", name: "안국", count: 1, operator: "정독도서관", lat: 37.576562, lng: 126.98547 },
  { line: "7호선", name: "중화", count: 1, operator: "중랑구청", lat: 37.602604, lng: 127.079254 },
  { line: "7호선", name: "용마산", count: 1, operator: "중랑구청", lat: 37.573752, lng: 127.086802 },
  { line: "7호선", name: "상봉", count: 1, operator: "중랑구청", lat: 37.595673, lng: 127.085708 },
  { line: "7호선", name: "사가정", count: 1, operator: "중랑구청", lat: 37.580912, lng: 127.088502 },
  { line: "7호선", name: "먹골", count: 1, operator: "중랑구청", lat: 37.610638, lng: 127.077719 },
  { line: "2호선", name: "충정로", count: 1, operator: "중림동주민센터", lat: 37.559742, lng: 126.964455 },
  { line: "7호선", name: "철산", count: 1, operator: "평생학습사업본부(철산도서관)", lat: 37.47616, lng: 126.868217 },
  { line: "7호선", name: "광명사거리", count: 1, operator: "평생학습사업본부(광명도서관)", lat: 37.47927, lng: 126.854854 }
    ];

    locations.forEach(loc => {
        const markerPosition = new kakao.maps.LatLng(loc.lat, loc.lng);
        const marker = new kakao.maps.Marker({
            position: markerPosition,
            map: kakaoMap
        });

        const content = `
            <div class="custom-infowindow">
                <div class="info-title">${loc.name}역 스마트도서관</div>
                <div class="info-body">
                    <strong>호선:</strong> ${loc.line}<br>
                    <strong>설치대수:</strong> ${loc.count}대<br>
                    <strong>운영주체:</strong> ${loc.operator}<br>
                    <a href="https://map.kakao.com/link/to/${loc.name}역 스마트도서관,${loc.lat},${loc.lng}" target="_blank" class="info-link">
                        <i class="fa-solid fa-route"></i> 길찾기 연결
                    </a>
                </div>
            </div>
        `;

        const infowindow = new kakao.maps.InfoWindow({
            content: content,
            removable: true
        });

        kakao.maps.event.addListener(marker, 'click', function() {
            if (currentInfoWindow) {
                currentInfoWindow.close();
            }
            infowindow.open(kakaoMap, marker);
            currentInfoWindow = infowindow;
        });
    });

    setTimeout(() => { kakaoMap.relayout(); }, 150);
}

// 4. 검색 모듈 디비전
function setupSearch() {
    const searchInput = document.getElementById('book-search');
    const searchBtn = document.getElementById('search-btn');
    if(searchBtn) searchBtn.onclick = performSearch;
    if(searchInput) {
        searchInput.onkeypress = (e) => { if (e.key === 'Enter') performSearch(); };
    }
}

function performSearch() {
    const query = document.getElementById('book-search').value.trim().toLowerCase();
    if (query === "") return alert("검색어를 입력해 주세요!");

    const filteredResults = globalLibraryBooks.filter(book => {
        return book.title.toLowerCase().includes(query) || 
               book.author.toLowerCase().includes(query) || 
               book.location.toLowerCase().includes(query);
    });

    document.getElementById('main-dashboard-page').style.display = 'none';
    document.getElementById('search-results-page').style.display = 'block';

    const resultsList = document.getElementById('results-list');
    document.getElementById('result-count').innerText = filteredResults.length;
    resultsList.innerHTML = "";

    if (filteredResults.length === 0) {
        resultsList.innerHTML = `<p style="text-align:center; color:#999; padding:40px 0;">결과가 없습니다.</p>`;
        return;
    }

    filteredResults.forEach(book => {
        const bookCard = document.createElement('div');
        bookCard.className = 'book-item-card';
        bookCard.innerHTML = `
            <div class="book-title">${book.title}</div>
            <div class="book-info">저자: ${book.author} | 출판사: ${book.publisher}</div>
            <span class="station-tag">📍 ${book.location} 스마트도서관</span>
        `;
        resultsList.appendChild(bookCard);
    });
    window.scrollTo(0, 0);
}