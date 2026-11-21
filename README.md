# Awesome BIM Tools

I maintain this curated list of tools for BIM and the Autodesk ecosystem.
Each entry is checked before it is listed.
The same data powers [Best of BIM](https://sharafutdinov.online/bestofbim).

## Suggest a tool

[Open the suggestion form](https://github.com/sharafutdinovdi/awesome-bim-tools/issues/new?template=suggest-tool.yml) and include a public link to the tool.

## What gets listed

The list covers software a BIM practitioner or BIM developer uses: tools in the Autodesk ecosystem, other BIM authoring and coordination tools, and openBIM and IFC tools and viewers.
Generic CAD or 3D libraries, ERP or cost databases, abandoned projects, courses, services and job posts are out of scope.
Listings link to third-party software. Review a tool before you install it.

## For AI agents and scripts

Use [AGENTS.md](AGENTS.md) to find tools, suggest a new tool or correct a listing.
Read the [raw catalog JSON](https://raw.githubusercontent.com/sharafutdinovdi/awesome-bim-tools/main/dist/tools.json) in one request.
See the [catalog schema](schema/catalog.schema.json) and [tool schema](schema/tool.schema.json) for the data contract.

## Tools

<!-- BEGIN TOOLS -->

### Automation and scripting

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [BIM Project Suite](<https://ctcsoftware.com/product/bim-project-suite>) | CTC Software | Revit | freemium | Bundles Revit tools for sheet production, model data editing and project analysis. |
| [Dynamo](<https://github.com/DynamoDS/Dynamo>) | Autodesk and Dynamo contributors | Revit, Standalone | open-source | Provides visual programming and textual scripting for computational design and automation. |
| [DynamoRevit](<https://github.com/DynamoDS/DynamoRevit>) | DynamoDS | Revit, Dynamo | open-source | Provides a Revit plugin and a library of Dynamo nodes. |
| [Ideate Automation](<https://ideatesoftware.com/ideate-automation>) | Ideate Software, GRAITEC Group | Revit | paid | Runs background Revit tasks such as exports, data extraction and warning reports. |
| [Bonus Tools](<https://apps.autodesk.com/RVT/en/Detail/Index?id=2077603980990329161&amp;appLang=en&amp;os=Win64>) | KiwiCodes | Revit | paid | Bundles Revit commands for sheets, families, parameters, Excel exchange and quality control. |
| [Naviate Accelerate](<https://store.naviate.com/products/naviate-accelerate>) | Naviate | Revit | paid | Provides Revit parameter editing, project cleanup, publishing and productivity commands. |
| [pyRevit](<https://github.com/pyrevitlabs/pyRevit>) | pyRevit Labs | Revit | open-source | Provides a scripting environment, deployment utilities and productivity commands for Revit. |

### Documentation and sheets

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [Archeform BIM for SketchUp](<https://archeform.eu/>) | Archeform s.r.o. | SketchUp | paid | Adds BIM elements, technical drawings, material schedules and IFC4 export to SketchUp. |
| [Tiny Tools](<https://www.archilizer.com/projects/tiny-tools>) | Archilizer | Revit | free | Duplicates Revit views and sheets and aligns viewports for drawing production. |
| [Glyph](<https://www.evolvelab.io/glyph>) | EvolveLAB / Chaos | Revit | paid | Automates Revit views, sheets, tags, dimensions and sheet packing. |
| [Ideate Sticky](<https://ideatesoftware.com/ideate-sticky>) | Ideate Software, GRAITEC Group | Revit | paid | Links formatted Excel, Word and PDF content into Revit project documentation. |
| [ProSheets](<https://diroots.com/apps/>) | DiRoots | Revit | freemium | Batch exports Revit views and sheets to PDF, CAD, model and image formats. |
| [SheetGen](<https://diroots.com/revit-plugins/batch-create-revit-sheets-and-place-views-with-sheetgen/>) | DiRoots | Revit | free | Automates Revit sheet creation and management. |
| [TableGen](<https://diroots.com/revit-plugins/excel-to-revit-as-drafting-legend-and-schedule-views-with-tablegen/>) | DiRoots | Revit | paid | Imports spreadsheet tables into Revit legends, drafting views and schedules. |

### Data and parameters

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [FamilyReviser](<https://diroots.com/revit-plugins/manage-revit-families-and-worksets-with-familyreviser/>) | DiRoots | Revit | freemium | Manages Revit families and worksets and exports families from projects. |
| [Ideate BIMLink](<https://ideatesoftware.com/ideate-bimlink>) | Ideate Software, GRAITEC Group | Revit | paid | Exports Revit model data to Excel and imports spreadsheet edits back into the model. |
| [OneFilter](<https://diroots.com/revit-plugins/revit-advanced-filter-onefilter/>) | DiRoots | Revit | freemium | Finds and filters Revit elements, including searches in linked models. |
| [ParaManager](<https://diroots.com/revit-plugins/manage-revit-paramanager-in-projects-and-families-with-paramanager/>) | DiRoots | Revit | free | Manages project, family and shared parameters in Revit. |
| [SheetLink](<https://diroots.com/revit-plugins/revit-to-excel-sheetlink/>) | DiRoots | Revit | paid | Exports and edits Revit model data through spreadsheet workflows. |

### Model QA and coordination

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [BIMcollab Zoom](<https://www.bimcollab.com/en/plans/bimcollab-modelchecking>) | BIMcollab | Standalone | freemium | Federates models and provides clash detection, IDS validation and coordination workflows. |
| [Guardian](<https://www.getguardian.tech/>) | Guardian | Revit | paid | Enforces Revit standards, protects model elements and reports model and user activity. |
| [Ideate Explorer](<https://ideatesoftware.com/ideate-explorer>) | Ideate Software, GRAITEC Group | Revit | paid | Browses model elements, filters parameters and reviews Revit warnings. |
| [Pinly for Revit](<https://www.apps.atomatiq.io/pinly>) | atomatiq | Revit | freemium | Attaches comment threads and coordination feedback to Revit model elements. |
| [Revizto](<https://revizto.com/pricing>) | Revizto | Standalone | paid | Provides model review, clash automation and virtual reality with per-user or per-project licensing. |
| [Solibri](<https://www.solibri.com/our-offerings>) | Solibri | Standalone | paid | Federates models and checks BIM information and geometry against validation rules. |

### MEP and electrical

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [Atomatiq Electrical Pack](<https://www.apps.atomatiq.io/electrical-pack>) | atomatiq | Revit | paid | Calculates voltage drop, sizes wires and generates synchronized single-line diagrams in Revit. |

### AI and MCP

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [BIMwright rvt-mcp](<https://github.com/bimwright/rvt-mcp>) | BIMwright contributors | Revit | open-source | Provides local Revit MCP tools, C&#35; execution and optional reusable personal tools through ToolBaker. |
| [Finch](<https://docs.finch3d.com/site-to-bim-forma-finch-and-revit>) | Finch | Revit, Forma, Rhino | paid | Generates floor plans and connects Forma massing to Revit BIM workflows. |
| [Horizun Revit MCP](<https://github.com/HorizunGroup/horizun-revit-mcp>) | Horizun Group | Revit | open-source | Connects MCP clients to Revit for typed modelling, family authoring, audits and exports. |
| [KenLP Revit MCP Server](<https://github.com/KenLP/RevitMCPServer>) | KenLP | Revit | open-source | Exposes named Revit query and editing tools with dry runs and atomic batch transactions. |
| [MCP Servers for Revit](<https://github.com/mcp-servers-for-revit/mcp-servers-for-revit>) | mcp-servers-for-revit / Sparx contributors | Revit | open-source | Connects MCP clients to Revit through a TypeScript server, Revit plugin and command set. |
| [Qonic AI](<https://www.qonic.com/posts/qonic-november-2026-release>) | Qonic | Web | paid | Finds, checks and edits BIM data and geometry through agents inside Qonic's IFC-based environment. |
| [Revit Model MCP](<https://sharafutdinov.online/products/revit-model-mcp>) | Dinar Sharafutdinov | Revit | open-source | Connects MCP clients to live Revit models for querying, auditing and model operations. |
| [Snaptrude Agent](<https://www.snaptrude.com/product-releases/3-56-0>) | Snaptrude | Web | freemium | Turns briefs and prompts into editable Snaptrude design models, with paid BIM and export workflows. |
| [TestFit Site Solver](<https://www.testfit.io/product/site-solver>) | TestFit | Standalone, Revit | paid | Generates site feasibility layouts and transfers site and building geometry through a Revit add-in. |
| [Veras](<https://www.chaos.com/veras>) | Chaos / EvolveLAB | Revit, Forma, Web | paid | Generates AI visualizations from design geometry, sketches and reference images. |

### Visualization

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [Enscape](<https://www.chaos.com/enscape>) | Chaos | Revit, Rhino, SketchUp, Archicad | paid | Provides real-time rendering and virtual reality linked to supported design applications. |

### Interoperability and IFC

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [BIMCraft](<https://github.com/IPedrax/BIMCraft>) | IPedrax and contributors | Standalone | open-source | Open-source BIM authoring app in Rust that follows the Revit workflow and reads RVT and RFA files. |
| [Bonsai](<https://bonsaibim.org/>) | IfcOpenShell contributors | Blender | open-source | Authors and edits native IFC models within Blender. |
| [IES Sync for Revit](<https://www.iesve.com/products/ies-sync>) | Integrated Environmental Solutions | Revit, Standalone | paid | Prepares and transfers Revit analytical geometry for building-performance analysis in IES VE. |
| [IfcConvert](<https://docs.ifcopenshell.org/ifcconvert.html>) | IfcOpenShell contributors | Standalone | open-source | Converts IFC models into other geometry and data formats from the command line. |
| [Rhino.Inside.Revit](<https://www.rhino3d.com/inside/revit/1.0/getting-started>) | Robert McNeel &#38; Associates | Revit, Rhino | open-source | Embeds Rhino and Grasshopper within Revit for geometry and BIM workflows. |
| [Speckle for Revit](<https://speckle.systems/integrations/revit>) | Speckle | Revit | open-source | Exchanges Revit geometry and object data with other design tools through Speckle connectors. |

### Developer tools

| Name | Maker | Platforms | Pricing | What it does |
| --- | --- | --- | --- | --- |
| [Nice3point Revit Templates](<https://github.com/Nice3point/RevitTemplates>) | Nice3point | Revit | open-source | Scaffolds .NET Revit add-in projects with multi-version project templates. |
| [RevitDevTool](<https://github.com/Zhuangkh/RevitDevTool>) | Zhuangkh | Revit | open-source | Provides Revit development and debugging utilities, including transient geometry tracing. |
| [RevitLookup](<https://github.com/lookup-foundation/RevitLookup>) | Lookup Foundation | Revit | open-source | Inspects Revit database elements, properties, parameters and object relationships. |

<!-- END TOOLS -->

## Names and logos

Product names and logos belong to their owners.
A listing does not imply endorsement or partnership.
If you make a listed tool and want an entry changed or removed, [open an issue](https://github.com/sharafutdinovdi/awesome-bim-tools/issues/new?template=change-or-remove.yml).
