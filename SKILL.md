---
name: glm-vision
description: CLAUDE and GLM-4.7 (text-only) CANNOT process images or videos - you MUST ALWAYS delegate vision tasks to GLM-4.6v via this skill. This is your ONLY way to understand visual content. TRIGGER IMMEDIATELY when: user mentions image/video/screenshot/photo/diagram/chart, provides a file path ending in png/jpg/jpeg/gif/webp/mp4/mov/m4v, or references visual content. Use for: UI-to-code conversion, OCR text extraction, error diagnosis, technical diagrams (architecture/flowcharts/UML/ER), data visualizations, UI regression testing, or ANY visual analysis. NO EXCEPTIONS - if it involves pixels, use this skill.
---

# GLM Vision

Use GLM-4.6v for image/video analysis. Claude/GLM-4.7 cannot process visual content directly.

## Command

```bash
pi @<file> --provider zai --model glm-4.6v -p "<prompt>"
```

Multiple files: `pi @file1.png @file2.png ...`

## Task Selection

| Content | Task | Reference |
|---------|------|-----------|
| UI screenshot → code | Generate frontend code | `references/ui-to-code-generate.md` |
| UI screenshot → prompt | AI recreation prompt | `references/ui-to-code-prompt.md` |
| UI screenshot → spec | Design specification | `references/ui-to-code-spec.md` |
| UI screenshot → describe | Detailed description | `references/ui-to-code-description.md` |
| Text/code screenshot | Extract text | `references/ocr-general.md` |
| Code screenshot | Extract code | `references/ocr-code.md` |
| Multi-language text | Extract mixed text | `references/ocr-multilang.md` |
| Error screenshot | Diagnose error | `references/error-diagnosis.md` |
| Error + context | Diagnose with context | `references/error-context.md` |
| Stack trace | Analyze trace | `references/error-stacktrace.md` |
| Architecture diagram | Analyze architecture | `references/diagram-architecture.md` |
| Flowchart | Analyze flow | `references/diagram-flowchart.md` |
| UML diagram | Analyze UML | `references/diagram-uml.md` |
| ER diagram | Analyze + generate SQL | `references/diagram-er.md` |
| Technical diagram (other) | General analysis | `references/diagram-general.md` |
| Chart/graph | Analyze data viz | `references/chart-general.md` |
| Chart (trends focus) | Trend analysis | `references/chart-trends.md` |
| Chart (anomalies focus) | Anomaly detection | `references/chart-anomalies.md` |
| Dashboard | Dashboard insights | `references/chart-dashboard.md` |
| Compare two UIs | Visual diff | `references/ui-diff.md` |
| Compare UIs (focused) | Focused diff | `references/ui-diff-focused.md` |
| General image | Describe image | `references/image-general.md` |
| Logo | Analyze logo | `references/logo-analysis.md` |
| Video | Analyze video | `references/video-general.md` |
| Tutorial video | Extract steps | `references/video-tutorial.md` |

## Usage

1. Match content type to task in table above
2. **Simple tasks**: Construct prompt from reference pattern
3. **Complex tasks**: Read reference file for full template

## Notes

- Video analysis takes 4-5 minutes
- Include context for error diagnosis (language, framework, trigger)
- Specify framework preference for UI→code
