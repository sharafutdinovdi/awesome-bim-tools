# Work with Awesome BIM Tools

I maintain this catalog for BIM practitioners and developers.
Use it for Autodesk tools, other BIM authoring and coordination software, and openBIM and IFC tools and viewers.
Do not submit generic CAD or 3D libraries, ERP or cost databases, abandoned projects, courses, services or job posts.

## Find a tool

1. Fetch [the full catalog](https://raw.githubusercontent.com/sharafutdinovdi/awesome-bim-tools/main/dist/tools.json) in one request.
2. Read its `tools` array. The other envelope fields are `generatedAt` and `count`.
3. Match `category` and `pricing` by exact value, and test membership in `platforms`.
4. Check `oneLiner` against the requested task and give the user the tool's `website`. If nothing matches, say so.

| Field | Values |
| --- | --- |
| `category` | `automation`, `documentation`, `data`, `qa-coordination`, `mep`, `ai-mcp`, `visualization`, `interop-ifc`, `developer` |
| `platforms` | `Revit`, `Navisworks`, `AutoCAD`, `Civil 3D`, `Forma`, `Dynamo`, `Archicad`, `Tekla`, `SketchUp`, `Rhino`, `Blender`, `IFC`, `Standalone`, `Web` |
| `pricing` | `free`, `freemium`, `paid`, `open-source` |
| `source` | `community`, `scanner`, `editor` |

Each tool has `slug`, `name`, `vendor`, `category`, `platforms`, `pricing`, `oneLiner`, `website`, `addedAt`, `source` and `sourceUrl`.
Optional fields are `license`, `githubRepo`, `appStoreUrl` and `logo`.

`tools/<slug>.json` is the source of each entry; `dist/tools.json` is the generated full catalog.
Use [the tool schema](schema/tool.schema.json) for entry fields and [the catalog schema](schema/catalog.schema.json) for the feed.
Resolve `logo` relative to the repository root; logo files live in `logos/`.

## Suggest a tool

1. Check `dist/tools.json` for the same website, GitHub repository or name. Compare names and GitHub repositories without regard to case, and ignore website fragments and trailing slashes.
2. Use public, verifiable facts and the official project or product address. Do not guess. Describe what the tool does in one plain sentence of 20 to 140 characters, without links or promotion.
3. Open one issue per tool using one method below. Do not submit in bulk, resubmit a declined suggestion or open a PR for a new tool. I close PRs that add new tools.

I check suggestions against public sources and publish the official project or product address for accepted entries.
The outcome is posted as a comment on the issue.
Do not attach images or logos; the logo comes from the project's official source.

### Browser form

Use [the suggestion form](https://github.com/sharafutdinovdi/awesome-bim-tools/issues/new?template=suggest-tool.yml).
Prefill text inputs with `&title=...&<field-id>=...`, percent-encoding each value, then have the submitter review the result.

| Field type | Form IDs |
| --- | --- |
| Text input | `name`, `website`, `github-repo`, `app-store-url`, `maker`, `one-liner` |
| Dropdown | `category`, `pricing`, `relationship`, `submitted-with` |
| Checkboxes | `platforms`, `confirmation` |

[Example prefilled form for pyRevit](https://github.com/sharafutdinovdi/awesome-bim-tools/issues/new?template=suggest-tool.yml&title=Suggest%3A%20pyRevit&name=pyRevit&website=https%3A%2F%2Fgithub.com%2Fpyrevitlabs%2FpyRevit&github-repo=pyrevitlabs%2FpyRevit&maker=pyRevit%20Labs&one-liner=Provides%20a%20scripting%20environment%2C%20deployment%20utilities%20and%20productivity%20commands%20for%20Revit.) is an example only; pyRevit is already listed.
Set dropdowns and checkboxes in the form itself rather than relying on URL prefill for those controls.
Select `With an AI assistant` in `Submitted with` when applicable. It is for statistics only and grants no privileges.

### GitHub CLI or API

Use the title `Suggest: <name>` and a Markdown body in the exact format below.
Use all headings in order, with a blank line before each answer and between sections.
Write `_No response_` for blank optional fields. Use `- [x]` for selected checkboxes and `- [ ]` for unselected checkboxes. Confirm only after checking the links.
Use the category label from [the form](.github/ISSUE_TEMPLATE/suggest-tool.yml), not the catalog key, and choose `I make it`, `I use it` or `Other` for the submitter's actual relationship.
Do not add labels. The body structure is what identifies a suggestion.

```sh
gh issue create --repo sharafutdinovdi/awesome-bim-tools --title "Suggest: <name>" --body-file body.md
```

For the API, send the same `title` and `body` to `POST /repos/sharafutdinovdi/awesome-bim-tools/issues`.
If the create request has an uncertain outcome, check for the issue before trying again.

Example `body.md` for the already listed pyRevit. Replace the example values with verified facts about the tool being proposed.

```markdown
### Tool name

pyRevit

### Website

https://github.com/pyrevitlabs/pyRevit

### GitHub repository

pyrevitlabs/pyRevit

### Autodesk App Store URL

_No response_

### Maker

pyRevit Labs

### Category

Automation and scripting

### Platforms

- [x] Revit
- [ ] Navisworks
- [ ] AutoCAD
- [ ] Civil 3D
- [ ] Forma
- [ ] Dynamo
- [ ] Archicad
- [ ] Tekla
- [ ] SketchUp
- [ ] Rhino
- [ ] Blender
- [ ] IFC
- [ ] Standalone
- [ ] Web

### Pricing

open-source

### What does it do?

Provides a scripting environment, deployment utilities and productivity commands for Revit.

### Relationship to the tool

I use it

### Confirmation

- [x] The information is public and I agree that it may be listed here and on Best of BIM.

### Submitted with

With an AI assistant
```

## Correct or remove a listing

Use the [listing change form](https://github.com/sharafutdinovdi/awesome-bim-tools/issues/new?template=change-or-remove.yml) to request a correction or removal.
For a removal, include public evidence that the submitter makes the tool.
To propose a correction directly, open a PR that changes only the existing `tools/<slug>.json` file.
Check the edit with `node scripts/validate.mjs --data-only`.
To check generated output too, run `node scripts/build.mjs` and then `node scripts/validate.mjs` in a scratch copy of the checkout.
Do not include generated files in the PR.
