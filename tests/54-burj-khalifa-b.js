// Madde 54, aşama 2: yeniden yüklenince kule yerinde (kırpılan chunk'lar tam boya tamamlanıyor)
const g = window.game;
const { cx, cz, top } = JSON.parse(sessionStorage.getItem('burj') || '{}');
return { ok: !!cx && g.getBlock(cx, top, cz) === 60 && g.getBlock(cx, top - 1, cz) !== 0 && g.getBlock(cx, 255, cz) === 0, cx, cz, top };
