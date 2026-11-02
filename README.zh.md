# dsh-artcraft-skills

给 **14 个 ArtCraft 应用**用的智能体技能 —— 表格、文档、幻灯片、PDF、CAD、矢量、位图、照片 RAW、视频、动态图形、版式设计、界面设计与 3D 贴图。

[lznnnnn1998/dsh-artcraft](https://github.com/lznnnnn1998/dsh-artcraft) 里的插件提供的是**能力**:每个应用 14 个工具,菜单里的每个动作都能作为命令调用。这里的技能提供的是**方法**:该用哪个应用、按什么顺序、交付前必须通过什么验收。

这里的每个技能都是工作流,不是工具说明书。里面的配方都**实际跑过**,坑也都是跑的时候真踩到的。

| 技能 | 产出 | 串起来的应用 |
|---|---|---|
| [`artcraft`](skills/artcraft/SKILL.md) | 家族总览:两套接口、discover→describe→run 循环、各应用的坑、连接运行中的应用、视觉验收 | 全部 14 个 |
| [`artcraft-report`](skills/artcraft-report-kit/SKILL.md) | 数据报告,输出 DOCX + PDF,带**原生可编辑图表** | GridCraft → WordCraft |
| [`artcraft-brand-kit`](skills/artcraft-brand-kit/SKILL.md) | 设计系统变成导出资产 + 品牌手册 | FigCraft → DesignCraft |
| [`artcraft-explainer-video`](skills/artcraft-explainer-video/SKILL.md) | 幻灯片渲染成帧,剪成 MP4 | DeckCraft → FilmCraft → SoundCraft |
| [`artcraft-cad-set`](skills/artcraft-cad-set/SKILL.md) | 图纸包:逐张转换并合成一个 PDF | CADCraft → PdfCraft |
| [`artcraft-convert`](skills/artcraft-convert/SKILL.md) | 用**格式归属的应用**做转换 | 任意 → PDF/PNG/SVG/DOCX/… |

## 安装

```sh
git clone https://github.com/lznnnnn1998/dsh-artcraft-skills
cd dsh-artcraft-skills
node scripts/install.mjs            # 复制到 ~/.dsh/skills
```

DSH 从 `$DSH_HOME/skills/<name>/SKILL.md` 读取技能,所以安装就是复制:没有构建步骤,也不需要插件入口。可用 `--dsh-home` 指定别的 profile,`--dry-run` 先看一眼。

前提:同一个 DSH profile 里装了 ArtCraft 插件,机器上装了各应用的 CLI(插件仓库里的 `node scripts/install-craft.mjs`)。

## 写的是证据,不是断言

每个技能都写明了**验证过什么、没验证什么**。例如 `artcraft-report`:标题、正文、原生 Word 图表都实际产出,导出 PDF 后逐页渲染看过的;图表在 Word 里可编辑,而库方案只能塞一张图片。

如果某一步没法端到端跑通,技能里会直说,而不是含糊带过。

## 为什么不一个应用一个技能

14 份几乎一样的"discover→run"说明只会浪费上下文。家族技能讲一次通用循环就够了;另外五个之所以存在,是因为**应用之间串起来才有价值** —— 表格里的数据变成报告、幻灯片变成视频、图纸变成可交付的 PDF。

## 贡献

1. 配方要**跑出来**,第一次失败的命令写进"坑"里。
2. `node scripts/validate-skills.mjs` 必须通过 —— frontmatter 写坏会让技能**无声消失**,所以安装脚本会拒绝安装。
3. "边界"一节要诚实:哪些需要装应用。

## 许可证

MIT —— 见 [LICENSE](LICENSE)。
