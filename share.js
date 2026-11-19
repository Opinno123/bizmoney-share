/* 오피노 비즈머니 → 드림인사이트 카톡 공유 페이지.
   비즈머니 화면이 주소 # 뒤에 요청 내용을 넣어 연다(# 뒤는 서버로 가지 않는다).
   계정 1개 = 메시지 1개. 실제 전송은 공유 창에서 사람이 방을 골라 누른다. */
(function () {
  var JS_KEY = '0d43f3486cb880e6f42c8c3b5cf84a43';   // 카카오 개발자 앱 '오피노 비즈머니'(ID 1657269) JavaScript 키 — 도메인 opinno123.github.io만 허용
  var MAX = 200;                        // 텍스트형 본문 최대 글자 수(카카오 문서)
  var BTN = '충전 요청서';               // 메시지 아래 링크 버튼 문구(텍스트형은 버튼 1개 필수) → v.html 요청서
  var list = document.getElementById('list');

  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function b64dec(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); while (s.length % 4) s += '='; return decodeURIComponent(escape(atob(s))); }
  function b64enc(s) { return btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, ''); }
  function fail(msg) { list.innerHTML = '<div class="err">' + esc(msg) + '</div>'; }
  function len(s) { return Array.from(s).length; }

  var data;
  try {
    var m = /[#&]d=([^&]+)/.exec(location.hash);
    if (!m) { fail('요청 내용이 없습니다. 비즈머니 화면의 \'카톡으로 보내기\'로 열어 주세요.'); return; }
    data = JSON.parse(b64dec(m[1]));
    if (!data || !Array.isArray(data.items) || !data.items.length) throw new Error('empty');
  } catch (e) { fail('요청 내용을 읽지 못했습니다. 비즈머니 화면에서 다시 열어 주세요.'); return; }

  var ready = false;
  try { if (window.Kakao) { if (!Kakao.isInitialized()) Kakao.init(JS_KEY); ready = Kakao.isInitialized(); } } catch (e) { ready = false; }

  var base = location.href.split('#')[0].replace(/[^\/]*$/, '');
  list.innerHTML = data.items.map(function (it, i) {
    var n = len(it.t || ''), over = n > MAX;
    return '<div class="card"><h2><span>' + (data.items.length > 1 ? (i + 1) + '. ' : '') + esc(it.h || '') + '</span><small>' + n + '/' + MAX + '자</small></h2>' +
      '<pre>' + esc(it.t || '') + '</pre><div class="row"><button class="btn kk" data-i="' + i + '"' + (over || !ready ? ' disabled' : '') + '>카카오톡으로 보내기</button>' +
      '<button class="btn" data-c="' + i + '">문구 복사</button><span class="st' + (over ? ' bad' : '') + '" id="s' + i + '">' +
      (over ? MAX + '자를 넘어 보낼 수 없습니다. 비즈머니 화면에서 계정명을 줄여 주세요.' : !ready ? '카카오 연결을 못 했습니다. 문구 복사로 직접 붙여 넣어 주세요.' : '') + '</span></div></div>';
  }).join('');

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-c')) {
      var t = data.items[+b.getAttribute('data-c')].t, st = document.getElementById('s' + b.getAttribute('data-c'));
      var done = function () { st.className = 'st ok'; st.textContent = '복사했습니다.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { st.textContent = '복사하지 못했습니다. 글을 길게 눌러 복사해 주세요.'; });
      return;
    }
    var i = +b.getAttribute('data-i'), it = data.items[i], s = document.getElementById('s' + i);
    // 요청서 링크: 항목별 값 + 요청자 + 보낸 시각. 예전 형식(문구만)이면 문구로
    var url = it.b ? base + 'v.html?d=' + b64enc(JSON.stringify({ b: it.b, n: it.n, i: it.i, d: it.d, a: it.a, by: data.by || '', at: Date.now() })) : base + 'v.html?t=' + b64enc(it.t);
    try {
      Kakao.Share.sendDefault({ objectType: 'text', text: it.t, link: { webUrl: url, mobileWebUrl: url }, buttonTitle: BTN });
      s.className = 'st ok'; s.textContent = '공유 창을 열었습니다. 단톡방을 골라 보냈는지 확인해 주세요.';
      b.textContent = '다시 열기';
    } catch (err) { s.className = 'st bad'; s.textContent = '공유 창을 열지 못했습니다: ' + (err && err.message || err); }
  });
})();
