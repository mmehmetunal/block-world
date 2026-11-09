// Madde 55, aşama 3: sürüm 4 kaydı 16 bit olarak geri gelir
const g = window.game, B = g.blocks;
const c = g.worlds.overworld.get('0,0');
const r = { uint16: c instanceof Uint16Array, bars: g.getBlock(6, 30, 5) === B.iron_bars, stairs: g.getBlock(7, 30, 5) === B.oak_stairs_north_top, glow: g.getBlock(5, 30, 5) === 60 };
return { ok: Object.values(r).every(Boolean), ...r };
