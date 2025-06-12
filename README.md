# 🤖 AI Agent Evaluation System

<div align="center">
    <img src="https://raw.githubusercontent.com/agentuity/cli/refs/heads/main/.github/Agentuity.png" alt="Agentuity" width="100"/> <br/>
    <strong>Multi-Agent Evaluation Framework</strong> <br/>
<br />
</div>

Welcome to the Agentuity AI Agent Evaluation System! This project provides a comprehensive framework for evaluating AI models using a multi-agent architecture that orchestrates dataset loading, prompt templating, model execution, and result analysis.

## 🎯 Overview

This evaluation system uses multiple specialized agents to create a robust, scalable framework for testing AI models against ground truth datasets. Each agent has a discrete task and can pass information to others through the Agentuity key-value store.

The system includes a modern **React-based web interface** that provides:
- **Results Dashboard**: View evaluation summaries, detailed results, and real-time progress
- **Dataset Management**: Upload and manage evaluation datasets
- **Evaluation Configuration**: Set up new evaluations with custom parameters
- **Settings Management**: Configure API endpoints and authentication

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│  Dataset Loader │───▶│ Template Manager│───▶│ Evaluation      │
│     Agent       │    │     Agent       │    │ Runner Agent    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  LLM as Judge   │◀───│   Claude API    │
                       │     Agent       │    │  (integrated)   │
                       └─────────────────┘    └─────────────────┘
                                                        │
                                                        ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │  Results API    │───▶│  React Frontend │
                       │     Agent       │    │   (Web UI)      │
                       └─────────────────┘    └─────────────────┘
```

## 🏗️ Agent Structure

### Core Agents

- **`dataset_loader`**: Loads and validates ground truth evaluation datasets
- **`template_manager`**: Handles prompt templates with variable substitution
- **`evaluation_runner`**: Executes evaluation cases, coordinates model testing, and communicates directly with AI models (Claude, GPT, etc.)
- **`llm_as_judge`**: Uses Claude to intelligently compare model outputs against expected results with 0-100 similarity scoring
- **`results_api`**: Serves evaluation data from KV store to the React frontend

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

- **Python**: Version 3.10 or higher
- **UV**: Version 0.5.25 or higher ([Documentation](https://docs.astral.sh/uv/))
- **Node.js**: Version 18 or higher
- **npm**: Latest version
- **Agentuity CLI**: Latest version

## 🚀 Getting Started

### Authentication

```bash
agentuity login
```

### Quick Setup

1. **Start Development Environment**:
   ```bash
   # Start the Agentuity development server
   agentuity dev
   ```

2. **Configure Backend**:
   ```bash
   # Run the setup script (uses dev environment by default)
   python setup_env.py
   
   # Or manually set environment variables (optional)
   export AGENTUITY_BASE_URL=" https://dev-i9bbrvz6i.agentuity.run"
   ```

3. **Install Backend Dependencies**:
   ```bash
   uv sync
   ```

4. **Install Frontend Dependencies**:
   ```bash
   cd react-frontend
   npm install
   ```

5. **Test Connection**:
   ```bash
   # Test your dev environment
   python setup_env.py --test
   ```

### Run the Frontend

Start the React web interface:

```bash
cd react-frontend
npm run dev
```

The frontend will be available at `http://localhost:5173`

### Development Mode (Backend)

Run the evaluation system in development mode:

```bash
agentuity dev
```

Or start locally without the console:

```bash
uv run server.py
```

## 🛠️ Configuration

### Development Environment

The system is configured to use the Agentuity development environment:

- **Base URL**: `https://dev-i9bbrvz6i.agentuity.run`
- **Dataset Loader Agent ID**: `agent_abcf9ad4245d2d89aed9eb38aef21fd6`
- **Results API Agent ID**: `agent_b46de37831f94d01b06b2ccfd183efa0`
- **Authentication**: Optional (not required in dev mode)

### Environment Variables

```bash
# Required
AGENTUITY_BASE_URL=https://dev-uzeflmvib.agentuity.run

# Optional
DATASET_LOADER_AGENT_ID=agent_abcf9ad4245d2d89aed9eb38aef21fd6
RESULTS_API_AGENT_ID=agent_b46de37831f94d01b06b2ccfd183efa0
AGENTUITY_API_TOKEN=  # Not required for dev mode
```

### Development Setup

1. **Start the development server**:
   ```bash
   agentuity dev
   ```

2. **Verify agents are loaded**:
   ```
   [INFO ] Loaded 6 agents
   [INFO ] Loaded agent: dataset_loader [agent_abcf9ad4245d2d89aed9eb38aef21fd6]
   [INFO ] Loaded agent: results_api [agent_b46de37831f94d01b06b2ccfd183efa0]
   [INFO ] Starting server on port 63229
   ```

3. **Use the public URL**: `https://dev-uzeflmvib.agentuity.run` 
You must set this URL in your `react-frontend/src/services/api` file.

### API Testing

Test your development environment:

```bash
# Using curl (no auth required)
curl https://dev-uzeflmvib.agentuity.run/agent_abcf9ad4245d2d89aed9eb38aef21fd6

# Using the setup script
python setup_env.py --test
```

## 📊 Usage

### Option 1: Using the Web Interface (Recommended)

1. **Start the Backend**: Run `agentuity dev`
2. **Start the Frontend**: 
   ```bash
   cd react-frontend
   npm run dev
   ```
3. **Configure Settings**: Go to Settings → General and configure your API endpoints
4. **Upload Dataset**: Use the Dataset Manager to upload or create evaluation data
5. **Configure Evaluation**: Go to "New Evaluation" and set up your test parameters
6. **Monitor Progress**: Watch real-time progress in the Results Dashboard
7. **Analyze Results**: View detailed analytics, charts, and export data

### Option 2: Using the API Directly

### 1. Prepare Your Dataset

Create a ground truth dataset in JSON format:

```json
[
  {
    "query": "What is the capital of New York?",
    "response": "Albany"
  },
  {
    "query": "What is the capital of California?", 
    "response": "Sacramento"
  }
]
```

### 2. Create an Evaluation Request

Send a request to the `dataset_loader` agent:

```json
{
  "evaluation_id": "state_capitals_eval_001",
  "dataset_path": "datasets/state_capitals.json",
  "format": "query_response_pairs",
  "prompt_template": {
    "template": "You are an expert on state capitals. Answer the following question: {{query}}",
    "variables": ["query"]
  },
  "model_config": {
    "model_name": "claude-3-5-sonnet-latest",
    "max_tokens": 100,
    "temperature": 0.1
  },
  "evaluation_settings": {
    "similarity_threshold": 80,
    "judge_model": "claude-3-5-haiku-latest"
  }
}
```

### 3. Review Results

The system will generate a comprehensive evaluation report:

```json
{
  "evaluation_id": "state_capitals_eval_001",
  "summary": {
    "total_cases": 50,
    "average_similarity_score": 87.2,
    "high_similarity_count": 42,
    "medium_similarity_count": 6,
    "low_similarity_count": 2,
    "high_similarity_rate": 0.84
  },
  "detailed_results": [...],
  "model_config": {...}
}
```

## 🔄 Data Flow

The evaluation system uses the Agentuity key-value store for agent communication:

1. **Initial Request** → `dataset_loader` agent
2. **Dataset Loading** → Key: `eval_run_{id}_dataset`
3. **Template Processing** → Key: `eval_run_{id}_processed`
4. **Evaluation Execution** → Key: `eval_run_{id}_results`
5. **LLM Judging** → Key: `eval_run_{id}_comparison` (Final structured results)
6. **Results API** → Serves data to React frontend via operation-based requests

## 🛠️ Configuration

### Environment Variables

Set up API keys for different models:

```bash
agentuity env set --secret ANTHROPIC_API_KEY=your_key_here
agentuity env set --secret OPENAI_API_KEY=your_key_here
```

### Evaluation Settings

Configure default evaluation parameters:

```bash
agentuity env set DEFAULT_MODEL=claude-3-5-sonnet-latest
agentuity env set DEFAULT_JUDGE_MODEL=claude-3-5-haiku-latest
agentuity env set DEFAULT_SIMILARITY_THRESHOLD=80
```

## 📁 Project Structure

```
├── agents/
│   ├── dataset_loader/         # Loads evaluation datasets
│   ├── template_manager/       # Manages prompt templates
│   ├── evaluation_runner/      # Executes evaluation cases and communicates with AI models
│   ├── llm_as_judge/          # Uses Claude to judge response similarity (0-100 scoring)
│   └── results_api/           # Serves evaluation data to frontend
├── react-frontend/             # React web interface
│   ├── src/                   # React source code
│   ├── public/                # Static assets
│   ├── package.json           # Frontend dependencies
│   └── vite.config.ts         # Vite configuration
├── datasets/                   # Ground truth datasets
├── .venv/                      # Virtual environment
├── pyproject.toml             # Backend dependencies
├── server.py                  # Server entry point
└── agentuity.yaml            # Project configuration
```

## 🎯 LLM-as-Judge Evaluation

The system uses Claude as an intelligent judge to evaluate response similarity:

- **Semantic Understanding**: Understands context, synonyms, and meaning beyond simple string matching
- **Flexible Scoring**: Provides 0-100 similarity scores with detailed reasoning
- **Context Aware**: Considers the original question, expected response, and actual response
- **Consistent**: Uses low temperature settings for reliable, repeatable judgments
- **Explainable**: Provides reasoning for each similarity score

## 🌐 Deployment

Deploy your evaluation system to Agentuity Cloud:

```bash
agentuity deploy
```

## 🆘 Troubleshooting

If you encounter issues:

1. Check agent logs in the Agentuity Console
2. Verify your dataset format matches the expected schema
3. Ensure all required environment variables are set
4. Check the React frontend logs in your terminal
5. Verify API connectivity in the Settings page
6. Join our [Discord community](https://discord.com/invite/vtn3hgUfuc) for support

## 📚 Documentation

- [Agentuity Python SDK](https://agentuity.dev/SDKs/python)
- [Agent Development Guide](https://agentuity.dev/guides/agents)
- [Evaluation Best Practices](https://agentuity.dev/guides/evaluation)

## 📝 License

This project is licensed under the terms specified in the LICENSE file.

## Architecture

- **React Frontend**: Modern UI built with Vite, React, TypeScript, and Tailwind CSS
- **Agentuity Backend**: Multi-agent system for running evaluations and storing results
- **Results API Agent**: Serves evaluation data from KV store to frontend

## Setup Instructions

### 1. Deploy the Results API Agent

The Results API agent is already included in your project. Deploy it with:

```bash
# Deploy all agents including the results API
agentuity deploy
```

### 2. Configure the Frontend

1. **Install dependencies**:
   ```bash
   cd react-frontend
   npm install
   ```

2. **Update API configuration** in the Settings page:
   - Go to Settings → General
   - Set your Agentuity Base URL (e.g., `https://dev-uzeflmvib.agentuity.run`)
   - Set the Results API Agent ID (e.g., `agent_b46de37831f94d01b06b2ccfd183efa0`)
   - Test the connection

3. **Start the development server**:
   ```bash
   npm run dev
   ```

### 3. Test the API

You can test the Results API agent directly:

```bash
# List evaluations
curl -X POST https://dev-uzeflmvib.agentuity.run/agent_b46de37831f94d01b06b2ccfd183efa0 \
  -H "Content-Type: application/json" \
  -d '{"operation": "list_evaluations"}'

# Get evaluation details
curl -X POST https://dev-uzeflmvib.agentuity.run/agent_b46de37831f94d01b06b2ccfd183efa0 \
  -H "Content-Type: application/json" \
  -d '{"operation": "get_evaluation_details", "evaluation_id": "your_eval_id"}'
```

## API Operations

The Results API agent provides these operations (sent in request body):

- `{"operation": "list_evaluations"}` - List all evaluations with metadata
- `{"operation": "get_evaluation_details", "evaluation_id": "eval_001"}` - Get detailed results for a specific evaluation  
- `{"operation": "get_evaluation_cases", "evaluation_id": "eval_001"}` - Get individual case results for an evaluation

## Data Flow

1. **Evaluation Execution**: Your existing agents (dataset_loader, model_executor, llm_as_judge) run evaluations and store results in KV store
2. **Results API**: The new Results API agent reads from KV store and serves data via operation-based requests
3. **Frontend**: React app sends POST requests with operation parameters to the Results API agent

## Features

### Results Dashboard
- **Summary View**: High-level metrics and charts
- **Detailed View**: Individual query-response pairs with similarity scores
- **Case Details**: Full comparison view with judge reasoning
- **Real-time Status**: Shows running, completed, and failed evaluations

### Settings
- **API Configuration**: Configure Agentuity endpoints and authentication
- **Connection Testing**: Verify connectivity to your Agentuity instance
- **Default Parameters**: Set default model and evaluation settings

## KV Store Data Structure

The system expects evaluation data in this format:

### Metadata (`eval_metadata` namespace)
```json
{
  "evaluation_id": "eval_001",
  "status": "comparison_completed",
  "started_at": "2024-01-15T10:30:00Z",
  "completed_at": "2024-01-15T10:35:00Z",
  "dataset_name": "superhero_powers.json",
  "model_name": "claude-3-5-sonnet-latest",
  "judge_model": "claude-3-5-haiku-latest",
  "similarity_threshold": 80,
  "total_cases": 12,
  "comparison_summary": {
    "average_similarity": 87.2,
    "high_similarity_count": 10,
    "medium_similarity_count": 2,
    "low_similarity_count": 0,
    "high_similarity_rate": 0.83
  }
}
```

### Comparison Results (`eval_comparison` namespace)
```json
{
  "evaluation_id": "eval_001",
  "total_cases": 12,
  "comparison_results": [
    {
      "case_id": "case_001",
      "original_query": "What are Superman's main superpowers?",
      "expected_response": "Superman's main superpowers include...",
      "model_response": "Superman possesses incredible strength...",
      "similarity_score": 92,
      "similarity_category": "high",
      "judge_reasoning": "Both responses accurately list...",
      "success": true
    }
  ]
}
```

## Development

### Frontend Development
```bash
cd react-frontend
npm run dev    # Start development server
npm run build  # Build for production
```

### Backend Development
```bash
agentuity deploy  # Deploy agent changes
agentuity logs    # View agent logs
```

## Troubleshooting

1. **Connection Failed**: Check that your Agentuity instance is running and the agent ID is correct
2. **No Evaluations Found**: Ensure your evaluation agents are storing data in the expected KV store format
3. **CORS Issues**: Make sure your Agentuity instance allows requests from your frontend domain

## Next Steps

- Add authentication/authorization
- Implement real-time updates for running evaluations
- Add export functionality for results
- Create evaluation templates and presets
