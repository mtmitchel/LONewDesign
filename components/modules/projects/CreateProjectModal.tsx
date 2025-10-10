"use client";

import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Loader, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { cn } from '../../ui/utils';

interface ProjectPhase {
  id: string;
  name: string;
  duration: string;
  startDate?: Date;
  endDate?: Date;
}

interface ProjectMilestone {
  id: string;
  name: string;
  date?: Date;
}

interface Task {
  id: string;
  title: string;
  description?: string;
}

interface AIProjectSuggestion {
  phases: ProjectPhase[];
  milestones: ProjectMilestone[];
  tasks: Task[];
  reasoning?: string;
}

interface ProjectCreationData {
  name: string;
  description?: string;
  dueDate?: Date;
  setupMethod: 'manual' | 'ai';
  aiPrompt?: string;
  aiSuggestions?: AIProjectSuggestion;
}

interface CreateProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  onProjectCreated: (project: any) => void;
}

type ModalStep = 'basics' | 'method' | 'ai-prompt' | 'ai-review';

export function CreateProjectModal({
  isOpen,
  onClose,
  onProjectCreated
}: CreateProjectModalProps) {
  const [currentStep, setCurrentStep] = useState<ModalStep>('basics');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Form data
  const [projectData, setProjectData] = useState<ProjectCreationData>({
    name: '',
    description: '',
    setupMethod: 'manual'
  });
  
  const [aiResults, setAIResults] = useState<AIProjectSuggestion | null>(null);

  const handleClose = () => {
    // Reset state on close
    setCurrentStep('basics');
    setProjectData({
      name: '',
      description: '',
      setupMethod: 'manual'
    });
    setAIResults(null);
    setError(null);
    onClose();
  };

  const handleBasicsNext = () => {
    if (!projectData.name.trim()) {
      setError('Project name is required');
      return;
    }
    setError(null);
    setCurrentStep('method');
  };

  const handleMethodNext = () => {
    if (projectData.setupMethod === 'manual') {
      handleCreateManual();
    } else {
      setCurrentStep('ai-prompt');
    }
  };

  const handleCreateManual = () => {
    console.log('Creating manual project:', projectData);
    onProjectCreated({
      id: `proj-${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      dueDate: projectData.dueDate,
      setupMethod: 'manual'
    });
    handleClose();
  };

  const handleAIGenerate = async () => {
    if (!projectData.aiPrompt?.trim()) {
      setError('Please describe your project');
      return;
    }
    
    setError(null);
    setIsGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const mockResults: AIProjectSuggestion = {
        phases: [
          { id: 'p1', name: 'Research & Planning', duration: '2 weeks' },
          { id: 'p2', name: 'Design & Architecture', duration: '3 weeks' },
          { id: 'p3', name: 'Implementation', duration: '6 weeks' },
          { id: 'p4', name: 'Testing & Refinement', duration: '2 weeks' }
        ],
        milestones: [
          { id: 'm1', name: 'Requirements finalized' },
          { id: 'm2', name: 'Design approved' },
          { id: 'm3', name: 'MVP complete' },
          { id: 'm4', name: 'Launch ready' }
        ],
        tasks: [
          { id: 't1', title: 'Gather requirements', description: 'Interview stakeholders' },
          { id: 't2', title: 'Create project charter', description: 'Define scope and goals' },
          { id: 't3', title: 'Set up development environment', description: 'Install tools and dependencies' }
        ],
        reasoning: 'Based on your project description, I\'ve created a phased approach with clear milestones and initial tasks to get you started.'
      };
      
      setAIResults(mockResults);
      setIsGenerating(false);
      setCurrentStep('ai-review');
    }, 2000);
  };

  const handleRegenerateAI = () => {
    setCurrentStep('ai-prompt');
    setAIResults(null);
  };

  const handleCreateWithAI = () => {
    console.log('Creating project with AI suggestions:', {
      ...projectData,
      aiSuggestions: aiResults
    });
    onProjectCreated({
      id: `proj-${Date.now()}`,
      name: projectData.name,
      description: projectData.description,
      dueDate: projectData.dueDate,
      setupMethod: 'ai',
      phases: aiResults?.phases,
      milestones: aiResults?.milestones,
      tasks: aiResults?.tasks
    });
    handleClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[var(--bg-surface)] border-[var(--border-default)]">
        <DialogHeader className="pb-[var(--space-4)]">
          <DialogTitle className="text-[color:var(--text-primary)]">
            Create new project
          </DialogTitle>
        </DialogHeader>

        {/* Step 1: Basics */}
        {currentStep === 'basics' && (
          <>
            <div className="space-y-[var(--space-4)]">
              <div>
                <Label htmlFor="name">Project name</Label>
                <Input
                  id="name"
                  placeholder="Enter project name"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">
                  Description <span className="text-[color:var(--text-secondary)]">(optional)</span>
                </Label>
                <Textarea
                  id="description"
                  placeholder="What is this project about?"
                  rows={3}
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">
                  Due date <span className="text-[color:var(--text-secondary)]">(optional)</span>
                </Label>
                <Input
                  id="dueDate"
                  type="date"
                  onChange={(e) => setProjectData({ ...projectData, dueDate: new Date(e.target.value) })}
                />
              </div>

              {error && (
                <div className="p-[var(--space-3)] bg-[var(--error-tint-10)] border border-[var(--error)] rounded-[var(--radius-md)]">
                  <div className="flex items-center text-[color:var(--error)]">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={handleClose}>Cancel</Button>
              <Button onClick={handleBasicsNext}>Next</Button>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Method Choice */}
        {currentStep === 'method' && (
          <>
            <div className="space-y-[var(--space-4)]">
              <div className="space-y-[var(--space-3)]">
                <Label>How would you like to set up this project?</Label>
                <RadioGroup 
                  defaultValue="manual" 
                  value={projectData.setupMethod}
                  onValueChange={(value: 'manual' | 'ai') => setProjectData({ ...projectData, setupMethod: value })}
                  className="space-y-[var(--space-2)]"
                >
                  <div className="flex items-start space-x-[var(--space-2)]">
                    <RadioGroupItem value="manual" id="manual" className="mt-1" />
                    <Label htmlFor="manual" className="font-normal cursor-pointer">
                      <div>I'll set this up myself</div>
                      <div className="text-xs text-[color:var(--text-secondary)]">
                        Create empty project and add tasks manually
                      </div>
                    </Label>
                  </div>
                  <div className="flex items-start space-x-[var(--space-2)]">
                    <RadioGroupItem value="ai" id="ai" className="mt-1" />
                    <Label htmlFor="ai" className="font-normal cursor-pointer">
                      <div>Help me plan this project</div>
                      <div className="text-xs text-[color:var(--text-secondary)]">
                        AI will suggest phases, milestones, and starter tasks
                      </div>
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="ghost" onClick={() => setCurrentStep('basics')}>Back</Button>
              <Button onClick={handleMethodNext}>
                {projectData.setupMethod === 'manual' ? 'Create project' : 'Next'}
              </Button>
            </DialogFooter>
          </>
        )}

        {/* Step 3B: AI Prompt */}
        {currentStep === 'ai-prompt' && (
          <>
            <div className="space-y-[var(--space-4)]">
              <div>
                <Label htmlFor="aiPrompt">Tell me about your project</Label>
                <Textarea
                  id="aiPrompt"
                  placeholder="Describe what you want to accomplish, any constraints, timeline, or specific requirements..."
                  rows={4}
                  value={projectData.aiPrompt}
                  onChange={(e) => setProjectData({ ...projectData, aiPrompt: e.target.value })}
                />
              </div>
              
              {error && (
                <div className="p-[var(--space-3)] bg-[var(--error-tint-10)] border border-[var(--error)] rounded-[var(--radius-md)]">
                  <div className="flex items-center text-[color:var(--error)]">
                    <AlertCircle className="w-4 h-4 mr-2" />
                    <span className="text-sm">{error}</span>
                  </div>
                </div>
              )}
              
              <Button
                onClick={handleAIGenerate}
                disabled={isGenerating}
                className="w-full"
              >
                {isGenerating ? (
                  <>
                    <Loader className="w-4 h-4 mr-2 animate-spin" />
                    Generating project plan...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Generate project plan
                  </>
                )}
              </Button>
            </div>
            
            {!isGenerating && (
              <DialogFooter>
                <Button variant="ghost" onClick={() => setCurrentStep('method')}>Back</Button>
                <Button variant="ghost" onClick={handleCreateManual}>Skip AI setup</Button>
              </DialogFooter>
            )}
          </>
        )}

        {/* Step 4: AI Review */}
        {currentStep === 'ai-review' && aiResults && (
          <>
            <div className="space-y-[var(--space-4)]">
              <div className="p-[var(--space-3)] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)]">
                <h4 className="font-medium mb-[var(--space-2)]">Suggested project phases</h4>
                {aiResults.phases.map(phase => (
                  <div key={phase.id} className="flex items-center justify-between py-[var(--space-1)]">
                    <span className="text-sm">{phase.name}</span>
                    <span className="text-xs text-[color:var(--text-secondary)]">{phase.duration}</span>
                  </div>
                ))}
              </div>
              
              <div className="p-[var(--space-3)] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)]">
                <h4 className="font-medium mb-[var(--space-2)]">Key milestones ({aiResults.milestones.length})</h4>
                <div className="text-sm text-[color:var(--text-secondary)]">
                  {aiResults.milestones.map(milestone => milestone.name).join(', ')}
                </div>
              </div>
              
              <div className="p-[var(--space-3)] bg-[var(--bg-surface-elevated)] rounded-[var(--radius-md)]">
                <h4 className="font-medium mb-[var(--space-2)]">Starter tasks ({aiResults.tasks.length})</h4>
                <div className="text-sm text-[color:var(--text-secondary)]">
                  First few tasks to get you started
                </div>
              </div>
            </div>
            
            <DialogFooter className="flex justify-between">
              <Button variant="ghost" onClick={handleRegenerateAI}>
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </Button>
              <div className="flex gap-[var(--space-2)]">
                <Button variant="ghost" onClick={handleCreateManual}>
                  Skip AI setup
                </Button>
                <Button onClick={handleCreateWithAI}>
                  Create with AI plan
                </Button>
              </div>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
