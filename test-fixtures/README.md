# Test Fixtures

Sample images for integration testing the GLM Image Summary extension.

## Images

| File | Category | Description |
|------|----------|-------------|
| `ui-screenshot.png` | ui-screenshot | Dashboard with sidebar, stats cards, chart, activity table |
| `code-screenshot.png` | code-screenshot | VS Code with TypeScript code (user.service.ts) |
| `error-screenshot.png` | error-screenshot | Terminal with TypeError and stack trace |
| `diagram.png` | diagram | Microservices architecture (API Gateway, services, database) |
| `chart.png` | chart | Monthly Revenue 2025 bar chart with trend line |
| `general.png` | general | Minimalist workspace photo (desk, laptop, plant) |

## Running Integration Tests

Integration tests require a ZAI API key:

```bash
# Set your API key
export ZAI_API_KEY="your-api-key-here"

# Run integration tests
npm run test:integration
```

Get an API key from [Z.AI](https://z.ai).

**Note:** Integration tests make real API calls to GLM-4.6v and consume credits. Each full test run analyzes 12 images (~4 minutes, ~$0.10-0.20).

---

## Performance Comparison: Generic vs Structured Prompt

We compared the baseline (generic "analyze this image" prompt) against our structured prompt with classification and specialized analysis templates.

### Response Times

| Image | Generic Prompt | Structured Prompt | Improvement |
|-------|---------------|-------------------|-------------|
| ui-screenshot | 31s | 19s | **39% faster** |
| code-screenshot | 26s | 15s | **42% faster** |
| error-screenshot | 25s | 15s | **40% faster** |
| diagram | 28s | 15s | **46% faster** |
| chart | 23s | 12s | **48% faster** |
| general | 36s | 12s | **67% faster** |
| **Total** | **169s** | **88s** | **48% faster** |

### Quality Comparison

| Aspect | Generic Prompt | Structured Prompt |
|--------|---------------|-------------------|
| Format | Varies, narrative style | Consistent, category first |
| Classification | Implicit/inferred | Explicit `**Category**: X` |
| Code extraction | Partial, prose description | Complete code with line numbers |
| Error diagnosis | Descriptive only | Actionable (root cause + fix) |
| Diagram analysis | General description | Components + relationships + protocols |
| Chart analysis | Overview | Specific data values + trends |

### Example: Code Screenshot

**Generic prompt output:**
```
This image shows a TypeScript file... contains a UserData interface with 
properties for id, username, email... The async function fetchUserData...
```

**Structured prompt output:**
```
**Category**: code-screenshot

```typescript
 1 import { apiClient } from './utils/api';
 2 
 3 // Interface definition for UserData structure
 4 export interface UserData {
 5   id: number;
 6   username: string;
...
```

The structured version extracts actual code that can be used directly.

### Conclusion

The structured prompt approach is:
- ✅ **48% faster** on average
- ✅ **Higher quality** output with consistent format
- ✅ **Actionable** results (extracted code, error fixes, structured data)
- ✅ **Zero added complexity** — just a better prompt

---

## Generating New Test Images

If you need to regenerate test images, use [Gemini with Nano Banana](https://gemini.google.com/app) (select "🍌Create images" from tools menu):

### Prompts

**ui-screenshot.png:**
```
Create a screenshot of a modern web application dashboard. Show a navigation 
sidebar on the left with menu items like "Dashboard", "Analytics", "Settings". 
The main area should have a header with a search bar, user avatar, and 
notification bell. Include a few stat cards showing numbers like "2,847 Users" 
and "Revenue $45.2k". Use a clean dark theme with blue accent colors.
```

**code-screenshot.png:**
```
Create a screenshot of a code editor showing TypeScript/JavaScript code. The 
code should be a function that fetches data from an API, with proper syntax 
highlighting. Show line numbers on the left (lines 1-25), a dark theme like 
VS Code's default. Include imports, an async function with try/catch, and comments.
```

**error-screenshot.png:**
```
Create a screenshot of a terminal window showing a Node.js error. Show a red 
error message "TypeError: Cannot read properties of undefined (reading 'map')" 
followed by a stack trace with file paths. Include the command "npm run build" 
at the top. Use a dark terminal theme with red error text.
```

**diagram.png:**
```
Create a software architecture diagram showing a microservices system. Include 
boxes for "API Gateway", "Auth Service", "User Service", "Database", and 
"Message Queue". Connect them with arrows labeled "REST", "gRPC", and "Pub/Sub". 
Use blue for services, green for database, orange for queue.
```

**chart.png:**
```
Create a business analytics chart showing monthly revenue data. Use a bar chart 
with a trend line. X-axis: months (Jan-Dec), Y-axis: revenue in thousands. 
Blue bars with red trend line. Title: "Monthly Revenue 2025". Show growth 
from $50k to $120k.
```

**general.png:**
```
Create a photograph of a modern office workspace. Show a wooden desk with a 
laptop, coffee mug, potted plant, and notebooks. Natural lighting from a 
window. Blurred bookshelves in background. Minimal and aesthetic.
```
