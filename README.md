# vCita AI-Powered Partner Recommendation System (MCP Server)

## Overview

This MCP (Model Context Protocol) server implements an AI-driven recommendation system that matches vCita SMB businesses with relevant partner offerings. The system enables marketing teams to create intelligent offering campaigns and provides sales teams with ranked lists of qualified prospects.

## 🎯 Core Features

### 1. Offering Ingestion Tool (Marketing)
**MCP Tool:** `create_offering`

**Purpose:** Enable marketing teams to create new partner offerings with AI-generated targeting rules

**Input Methods:**
- **PDF Processing**: Upload partner materials, product sheets, case studies
- **Interactive Chat**: Guided conversation to extract offering details and target criteria

**Output:**
- Structured offering definition with:
  - Targeting triggers and business rules
  - SMB qualification criteria  
  - Reasoning and value proposition

### 2. Sales Prospect Tool (Sales)
**MCP Tool:** `get_prospects_to_call`

**Purpose:** Provide sales teams with ranked, qualified prospect lists for specific offerings

**Output:**
- Ranked list of SMBs with:
  - Top 3 matched offerings per business
  - AI-generated reasoning for each match
  - Call status tracking (new/contacted/follow-up)
  - Contact priority scoring

## 🏗️ System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Marketing     │    │   MCP Server     │    │   Sales Team    │
│   (Offering     │───▶│   AI Engine      │───▶│   (Prospect     │
│    Creation)    │    │                  │    │    Calling)     │
└─────────────────┘    └──────────────────┘    └─────────────────┘
                              │
                              ▼
                    ┌──────────────────┐
                    │  Static File DB  │
                    │  (JSON Storage)  │
                    │                  │
                    │  • SMBs          │
                    │  • Offerings     │
                    │  • Match Results │
                    │  • Call Status   │
                    └──────────────────┘
```

## 📋 MCP Tools Specification

### Tool 1: `create_offering`
```json
{
  "name": "create_offering",
  "description": "Create a new partner offering with AI-generated targeting rules",
  "inputSchema": {
    "type": "object",
    "properties": {
      "offering_name": {"type": "string"},
      "partner_name": {"type": "string"},
      "input_method": {"enum": ["pdf", "interactive"]},
      "content": {"type": "string"},
      "target_business_size": {"type": "string"},
      "industry_focus": {"type": "array"}
    }
  }
}
```

**Usage Examples:**
```bash
# PDF-based offering creation
create_offering --name "SmartSlots Pro" --partner "ScheduleAI" --method pdf --content "path/to/product_sheet.pdf"

# Interactive offering creation  
create_offering --name "PickMyCall AI" --partner "VoiceBot" --method interactive
```

### Tool 2: `get_prospects_to_call`
```json
{
  "name": "get_prospects_to_call",
  "description": "Get ranked list of SMBs to call for specific offerings",
  "inputSchema": {
    "type": "object", 
    "properties": {
      "offering_ids": {"type": "array"},
      "max_results": {"type": "integer", "default": 20},
      "exclude_called": {"type": "boolean", "default": false},
      "priority_filter": {"enum": ["high", "medium", "low", "all"]}
    }
  }
}
```

**Usage Examples:**
```bash
# Get prospects for specific offerings
get_prospects_to_call --offerings ["smartslots", "pickmycall"] --max 10

# Get high-priority prospects only
get_prospects_to_call --offerings ["all"] --priority high --max 15
```

### Tool 3: `update_call_status`
```json
{
  "name": "update_call_status",
  "description": "Update call results and prospect status",
  "inputSchema": {
    "type": "object",
    "properties": {
      "business_id": {"type": "string"},
      "offering_id": {"type": "string"}, 
      "call_result": {"enum": ["interested", "not_interested", "callback", "no_answer"]},
      "notes": {"type": "string"},
      "next_action": {"type": "string"}
    }
  }
}
```

## 🗂️ Data Structure (Static File DB)

### SMB Business Record
```json
{
  "business_id": "biz_12345",
  "name": "Dental Care Plus",
  "category": "healthcare", 
  "staff_count": 5,
  "booking_patterns": {
    "monthly_appointments": 150,
    "cancellation_rate": 0.28,
    "no_show_rate": 0.12
  },
  "communication_data": {
    "monthly_calls": 85,
    "missed_call_rate": 0.35,
    "peak_hours": ["9-11", "14-16"]
  },
  "financial_indicators": {
    "revenue_trend": "declining",
    "overdue_payments": 2500.00
  },
  "offerings": [
    {
      "offering_id": "smartslots_pro",
      "match_score": 0.87,
      "reasoning": "High cancellation rate (28%) and irregular booking patterns indicate need for intelligent scheduling optimization",
      "status": "new",
      "last_contacted": null
    }
  ]
}
```

### Offering Definition
```json
{
  "offering_id": "smartslots_pro",
  "name": "SmartSlots Pro",
  "partner": "ScheduleAI",
  "description": "AI-powered scheduling optimization for high-cancellation businesses",
  "targeting_rules": {
    "cancellation_rate": {"min": 0.20},
    "appointment_volume": {"min": 50},
    "business_categories": ["healthcare", "beauty", "consulting"],
    "staff_size": {"min": 2, "max": 20}
  },
  "value_proposition": "Reduce cancellation impact by 40% with intelligent slot management",
  "created_at": "2024-01-15T10:30:00Z",
  "created_by": "marketing_user_123"
}
```

## 🚀 Implementation Approach (Hackathon Mode)

### Phase 1: Core Infrastructure
- [x] MCP server setup with tool definitions
- [ ] Static JSON file database structure
- [ ] Basic matching engine implementation
- [ ] Simple offering creation workflow

### Phase 2: AI Integration  
- [ ] PDF processing for offering extraction
- [ ] Interactive chat flow for offering creation
- [ ] Business-to-offering matching algorithms
- [ ] Reasoning generation for matches

### Phase 3: Sales Tools
- [ ] Prospect ranking and scoring
- [ ] Call status tracking
- [ ] Performance analytics dashboard

## 📝 Usage Workflows

### Marketing Workflow: Create New Offering
```
1. Marketing receives partner materials (PDF/docs)
2. Run: create_offering --method pdf --content "partner_materials.pdf"
3. AI extracts offering details and generates targeting rules
4. System creates offering record and runs initial matching
5. Marketing reviews and approves generated rules
```

### Sales Workflow: Daily Prospecting
```
1. Sales person starts daily calling session
2. Run: get_prospects_to_call --offerings ["smartslots"] --max 10
3. System returns ranked list with reasoning
4. Sales person makes calls and updates status
5. Run: update_call_status for each call result
6. System learns and improves future rankings
```

### Sample Conversation Flow
```
Sales Person: "Who should I call today?"
MCP Response: 
"Top 3 prospects for SmartSlots Pro:

1. Dental Care Plus (Score: 87%)
   - 28% cancellation rate (target: >20%)
   - 150 monthly appointments (good volume)
   - Healthcare category (perfect fit)
   - Status: New prospect

2. Beauty Studio Elite (Score: 82%) 
   - 31% cancellation rate (high need)
   - Irregular booking patterns detected
   - 3 staff members (right size)
   - Status: Follow-up needed

3. Legal Consultants LLC (Score: 78%)
   - 22% cancellation rate (above threshold)  
   - Professional services (good fit)
   - Growing team (recently added staff)
   - Status: New prospect"
```

## 🔧 Technical Implementation

### File Structure
```
mcp-server/
├── src/
│   ├── tools/
│   │   ├── create_offering.py
│   │   ├── get_prospects.py
│   │   └── update_status.py
│   ├── matching/
│   │   ├── engine.py
│   │   └── rules.py
│   ├── data/
│   │   ├── smbs.json
│   │   ├── offerings.json
│   │   └── matches.json
│   └── main.py
├── README.md
└── requirements.txt
```

### Key Dependencies
```
mcp>=0.1.0
openai>=1.0.0
pdfplumber>=0.7.0
pandas>=2.0.0
scikit-learn>=1.3.0
```

## 📊 Success Metrics

### For Marketing
- **Offering Creation Speed**: Time from partner materials to active targeting rules
- **Rule Accuracy**: % of generated rules that marketing approves without changes
- **Coverage**: % of partner offerings successfully converted to targetable campaigns

### For Sales  
- **Prospect Quality**: Conversion rate of recommended prospects
- **Time Efficiency**: Reduction in research time per prospect
- **Call Success**: % of calls resulting in meaningful conversations

### For System
- **Match Accuracy**: % of high-scored prospects that show genuine interest
- **Learning Rate**: Improvement in match quality over time
- **Data Coverage**: % of SMBs with sufficient data for accurate scoring

## 🎯 Next Steps

1. **MVP Development** (Week 1-2)
   - Implement basic MCP tools
   - Create static file database
   - Build simple matching engine

2. **AI Integration** (Week 3-4)  
   - Add PDF processing capabilities
   - Implement interactive offering creation
   - Enhance matching algorithms

3. **Pilot Testing** (Week 5-6)
   - Test with select partner offerings
   - Gather feedback from sales teams
   - Iterate based on results

4. **Production Readiness** (Week 7-8)
   - Add error handling and validation
   - Implement logging and monitoring
   - Prepare for scale testing

## 🤝 Contributing

This is a hackathon project focused on rapid prototyping. Key principles:
- **Speed over perfection**: Get working functionality first
- **Static data**: Use JSON files instead of databases initially  
- **Manual processes**: Some workflows can be manual for MVP
- **Iterative improvement**: Build, test, learn, repeat

---

**Note**: This is a prototype system designed to validate the AI-powered partner recommendation concept. Production implementation would require integration with vCita's live APIs, proper database infrastructure, and enhanced security measures.