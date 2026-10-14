// System font references only; proprietary font binaries are not redistributed.
export const FONT_OPTIONS=[
 {value:'sans',label:'微软雅黑',group:'中文字体',family:'"Microsoft YaHei", "PingFang SC", sans-serif'},
 {value:'serif',label:'宋体',group:'中文字体',family:'SimSun, "Songti SC", serif'},
 {value:'kai',label:'楷体',group:'中文字体',family:'KaiTi, "Kaiti SC", serif'},
 {value:'SimHei',label:'黑体',group:'中文字体',family:'SimHei, "Microsoft YaHei", sans-serif'},
 {value:'DengXian',label:'等线',group:'中文字体',family:'DengXian, "Microsoft YaHei", sans-serif'},
 {value:'FangSong',label:'仿宋',group:'中文字体',family:'FangSong, SimSun, serif'},
 {value:'YouYuan',label:'幼圆',group:'中文字体',family:'YouYuan, "Microsoft YaHei", sans-serif'},
 {value:'LiSu',label:'隶书',group:'中文字体',family:'LiSu, SimSun, serif'},
 ...[
  ['Arial','sans-serif'],['Arial Black','sans-serif'],['Arial Narrow','sans-serif'],['Bahnschrift','sans-serif'],['Segoe UI','sans-serif'],['Verdana','sans-serif'],['Trebuchet MS','sans-serif'],['Impact','sans-serif'],['Times New Roman','serif'],['Georgia','serif'],['Consolas','monospace'],['Courier New','monospace']
 ].map(([name,fallback])=>({value:name,label:name,group:'英文与拉丁字体',family:`"${name}", "Microsoft YaHei", ${fallback}`}))
];
export const FONT_FAMILIES=Object.fromEntries(FONT_OPTIONS.map(font=>[font.value,font.family]));
