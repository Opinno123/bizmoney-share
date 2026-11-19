/* 오피노 비즈머니 → 드림인사이트 카톡 공유 페이지(휴대폰 QR로 연다).
   비즈머니 화면이 주소 # 뒤에 요청 내용을 넣는다(# 뒤는 서버로 가지 않는다).
   v2 = 계정 값만 [[브랜드, 계정명, AdAccontNo, 충전일, 금액]] → 문구는 여기서 만든다(화면 diText와 같은 형식).
   여러 계정은 한 메시지에 묶고, 카톡 공유 한도(200자)를 넘으면 메시지를 나눈다. 전송은 사람이 방을 골라 누른다. */
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

  // ── 비즈머니 화면(Index.html) DI_HEAD·dayKo·diBlock·diText·diMsgs와 똑같이 유지할 것 — sim4가 화면 문구와 대조한다 ──
  var DI_HEAD = '안녕하세요, 부장님.\n아래 계정 충전 부탁드립니다.';
  function dayKo(d) { var m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(d || ''); if (!m) return d || ''; return (+m[2]) + '월 ' + (+m[3]) + '일(' + '일월화수목금토'.charAt(new Date(Date.UTC(+m[1], +m[2] - 1, +m[3])).getUTCDay()) + ')'; }
  function diBlock(x) { var a = x.amount > 0 ? Number(x.amount).toLocaleString('ko-KR') : '(금액)'; return '[' + x.brand + ']\n광고계정ID : ' + x.name + '\nAdAccontNo : ' + x.id + '\n충전요청금액 : ' + a + '원\n충전날짜 : ' + dayKo(x.date); }
  function diText(arr) { return DI_HEAD + '\n\n' + arr.map(diBlock).join('\n\n'); }
  function diMsgs(arr, max) { var out = [], cur = []; arr.forEach(function (x) { if (cur.length && len(diText(cur.concat([x]))) > max) { out.push(cur); cur = []; } cur.push(x); }); if (cur.length) out.push(cur); return out; }

  var data, msgs;
  try {
    var m = /[#&]d=([^&]+)/.exec(location.hash);
    if (!m) { fail('요청 내용이 없습니다. 비즈머니 화면의 \'휴대폰으로 보내기\' QR로 열어 주세요.'); return; }
    data = JSON.parse(b64dec(m[1]));
    if (!data || !Array.isArray(data.items) || !data.items.length) throw new Error('empty');
    if (data.v === 2) {
      var accs = data.items.map(function (x) { return { brand: x[0], name: x[1], id: String(x[2]), date: x[3], amount: +x[4] }; });
      msgs = diMsgs(accs, MAX).map(function (g) { return { accs: g, t: diText(g), h: g.map(function (x) { return x.brand + ' ' + x.name; }).join(' · ') }; });
    } else {   // v1(예전 링크): 계정마다 문구가 들어 있음
      msgs = data.items.map(function (it) { return { accs: it.b ? [{ brand: it.b, name: it.n, id: it.i, date: it.d, amount: it.a }] : [], t: it.t || '', h: it.h || '' }; });
    }
  } catch (e) { fail('요청 내용을 읽지 못했습니다. 비즈머니 화면에서 다시 열어 주세요.'); return; }

  var ready = false;
  try { if (window.Kakao) { if (!Kakao.isInitialized()) Kakao.init(JS_KEY); ready = Kakao.isInitialized(); } } catch (e) { ready = false; }

  var base = location.href.split('#')[0].replace(/[^\/]*$/, '');
  if (msgs.length > 1) document.getElementById('sub').innerHTML = '카톡 한 번에 보낼 수 있는 길이를 넘어 <b>메시지 ' + msgs.length + '개</b>로 나눴습니다. 순서대로 \'카카오톡으로 보내기\'를 누르고 <b>드림인사이트 x 오피노</b> 단톡방을 골라 보내 주세요.';
  list.innerHTML = msgs.map(function (g, i) {
    var n = len(g.t), over = n > MAX;
    return '<div class="card"><h2><span>' + (msgs.length > 1 ? '메시지 ' + (i + 1) + ' · ' : '') + esc(g.h) + '</span><small>' + n + '/' + MAX + '자</small></h2>' +
      '<pre>' + esc(g.t) + '</pre><div class="row"><button class="btn kk" data-i="' + i + '"' + (over || !ready ? ' disabled' : '') + '>카카오톡으로 보내기</button>' +
      '<button class="btn" data-c="' + i + '">문구 복사</button><span class="st' + (over ? ' bad' : '') + '" id="s' + i + '">' +
      (over ? MAX + '자를 넘어 보낼 수 없습니다. 문구 복사로 붙여 넣어 주세요.' : !ready ? '카카오 연결을 못 했습니다. 문구 복사로 직접 붙여 넣어 주세요.' : '') + '</span></div></div>';
  }).join('');

  list.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.hasAttribute('data-c')) {
      var t = msgs[+b.getAttribute('data-c')].t, st = document.getElementById('s' + b.getAttribute('data-c'));
      var done = function () { st.className = 'st ok'; st.textContent = '복사했습니다.'; };
      if (navigator.clipboard) navigator.clipboard.writeText(t).then(done, function () { st.textContent = '복사하지 못했습니다. 글을 길게 눌러 복사해 주세요.'; });
      return;
    }
    var i = +b.getAttribute('data-i'), g = msgs[i], s = document.getElementById('s' + i);
    // 요청서 링크: 이 메시지의 계정들 + 요청자 + 보낸 시각
    var url = g.accs.length ? base + 'v.html?d=' + b64enc(JSON.stringify({ items: g.accs.map(function (x) { return [x.brand, x.name, x.id, x.date, x.amount]; }), by: data.by || '', at: Date.now() })) : base + 'v.html?t=' + b64enc(g.t);
    try {
      Kakao.Share.sendDefault({ objectType: 'text', text: g.t, link: { webUrl: url, mobileWebUrl: url }, buttonTitle: BTN });
      s.className = 'st ok'; s.textContent = '공유 창을 열었습니다. 단톡방을 골라 보냈는지 확인해 주세요.';
      b.textContent = '다시 열기';
    } catch (err) { s.className = 'st bad'; s.textContent = '공유 창을 열지 못했습니다: ' + (err && err.message || err); }
  });
})();
