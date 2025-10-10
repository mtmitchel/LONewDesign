"use client";

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Sparkles, RefreshCw, Loader, AlertCircle, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../../ui/dialog';
import { Button } from '../../ui/button';
import { Input } from '../../ui/input';
import { Label } from '../../ui/label';
import { Textarea } from '../../ui/textarea';
import { RadioGroup, RadioGroupItem } from '../../ui/radio-group';
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover';
import { Calendar as CalendarComponent } from '../../ui/calendar';
import { format } from 'date-fns';
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

  // Progress tracking
  const stepOrder: ModalStep[] = ['basics', 'method', 'ai-prompt', 'ai-review'];
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const totalSteps = projectData.setupMethod === 'ai' ? 4 : 2;
  const currentStepNumber = currentStepIndex + 1;
  const progressPercent = (currentStepNumber / totalSteps) * 100;

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
      <DialogContent 
        className="max-w-[480px] bg-[var(--bg-surface)] border border-[var(--border-default)] shadow-[var(--elevation-xl)] fixed"
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          marginLeft: '-20px',
          transform: 'translate(-50%, -50%)'
        }}>
        <DialogHeader className="pb-[var(--space-6)] border-b border-[var(--border-subtle)]">
          <DialogTitle className="text-xl font-semibold text-[color:var(--text-primary)] mb-[var(--space-1)]">
            Create new project
          </DialogTitle>
          {currentStep !== 'basics' && (
            <div className="flex items-center gap-[var(--space-2)] mt-[var(--space-3)]">
              <div className="h-1 flex-1 bg-[var(--bg-surface-elevated)] rounded-full overflow-hidden">
                <div 
                  className="h-full bg-[var(--primary)] transition-all duration-300 rounded-full"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <span className="text-xs text-[color:var(--text-secondary)] font-medium">
                Step {currentStepNumber} of {totalSteps}
              </span>
            </div>
          )}
        </DialogHeader>

        {/* Step 1: Basics */}
        {currentStep === 'basics' && (
          <>
            <div className="space-y-[var(--space-6)] py-[var(--space-6)]">
              <div className="space-y-[var(--space-2)]">
                <Label 
                  htmlFor="projectName" 
                  className="text-sm font-medium text-[color:var(--text-primary)]"
                >
                  Project name
                </Label>
                <Input
                  id="projectName"
                  placeholder="Enter project name"
                  className="h-11 px-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] transition-all"
                  value={projectData.name}
                  onChange={(e) => setProjectData({ ...projectData, name: e.target.value })}
                  required
                />
              </div>
              
              <div className="space-y-[var(--space-2)]">
                <Label 
                  htmlFor="projectDescription" 
                  className="text-sm font-medium text-[color:var(--text-primary)]"
                >
                  Description
                  <span className="text-xs text-[color:var(--text-secondary)] font-normal ml-[var(--space-1)]">
                    (optional)
                  </span>
                </Label>
                <Textarea
                  id="projectDescription"
                  placeholder="What is this project about?"
                  rows={3}
                  className="px-[var(--space-3)] py-[var(--space-3)] border border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] transition-all resize-none"
                  value={projectData.description}
                  onChange={(e) => setProjectData({ ...projectData, description: e.target.value })}
                />
              </div>
              
              <div className="space-y-[var(--space-2)]">
                <Label 
                  htmlFor="dueDate"
                  className="text-sm font-medium text-[color:var(--text-primary)]"
                >
                  Due date
                  <span className="text-xs text-[color:var(--text-secondary)] font-normal ml-[var(--space-1)]">
                    (optional)
                  </span>
                </Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      id="dueDate"
                      variant="outline"
                      className={cn(
                        "w-full h-11 px-[var(--space-3)] justify-start text-left font-normal",
                        "border border-[var(--border-default)] rounded-[var(--radius-md)]",
                        "bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-elevated)]",
                        "focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] transition-all",
                        !projectData.dueDate && "text-[color:var(--text-secondary)]",
                        projectData.dueDate && "text-[color:var(--text-primary)]"
                      )}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {projectData.dueDate ? format(projectData.dueDate, 'PPP') : 'Select due date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={projectData.dueDate}
                      onSelect={(date) => setProjectData({ ...projectData, dueDate: date })}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
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
            
            <DialogFooter className="pt-[var(--space-6)] border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-end gap-[var(--space-3)]">
                <Button 
                  variant="ghost" 
                  onClick={handleClose}
                  className="px-[var(--space-4)] h-10 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleBasicsNext}
                  disabled={!projectData.name.trim()}
                  className="px-[var(--space-6)] h-10 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                >
                  Next
                  <ChevronRight className="w-4 h-4 ml-[var(--space-1)]" />
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {/* Step 2: Method Choice */}
        {currentStep === 'method' && (
          <>
            <div className="space-y-[var(--space-4)] py-[var(--space-6)]">
              <div className="space-y-[var(--space-1)]">
                <h3 className="text-base font-semibold text-[color:var(--text-primary)]">
                  How would you like to set up this project?
                </h3>
                <p className="text-sm text-[color:var(--text-secondary)]">
                  Choose how to structure your project phases and tasks
                </p>
              </div>
              
              <RadioGroup 
                defaultValue="manual" 
                value={projectData.setupMethod}
                onValueChange={(value: 'manual' | 'ai') => setProjectData({ ...projectData, setupMethod: value })}
                className="space-y-[var(--space-3)]"
              >
                <Label 
                  htmlFor="manual"
                  className={cn(
                    "flex items-start gap-[var(--space-4)] p-[var(--space-4)] border-2 rounded-[var(--radius-md)] cursor-pointer transition-all",
                    projectData.setupMethod === 'manual' 
                      ? "border-[var(--primary)] bg-[var(--primary-tint-10)]" 
                      : "border-[var(--border-default)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)]"
                  )}
                >
                  <RadioGroupItem value="manual" id="manual" className="sr-only" />
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                    projectData.setupMethod === 'manual'
                      ? "border-[var(--primary)] bg-[var(--primary)]"
                      : "border-[var(--border-default)]"
                  )}>
                    {projectData.setupMethod === 'manual' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 space-y-[var(--space-1)]">
                    <div className="font-medium text-[color:var(--text-primary)]">
                      I'll set this up myself
                    </div>
                    <div className="text-sm text-[color:var(--text-secondary)]">
                      Create empty project and add tasks manually
                    </div>
                  </div>
                </Label>
                
                <Label 
                  htmlFor="ai"
                  className={cn(
                    "flex items-start gap-[var(--space-4)] p-[var(--space-4)] border-2 rounded-[var(--radius-md)] cursor-pointer transition-all",
                    projectData.setupMethod === 'ai' 
                      ? "border-[var(--primary)] bg-[var(--primary-tint-10)]" 
                      : "border-[var(--border-default)] hover:border-[var(--border-default)] hover:bg-[var(--bg-surface-elevated)]"
                  )}
                >
                  <RadioGroupItem value="ai" id="ai" className="sr-only" />
                  <div className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 transition-colors",
                    projectData.setupMethod === 'ai'
                      ? "border-[var(--primary)] bg-[var(--primary)]"
                      : "border-[var(--border-default)]"
                  )}>
                    {projectData.setupMethod === 'ai' && (
                      <div className="w-2 h-2 rounded-full bg-white" />
                    )}
                  </div>
                  <div className="flex-1 space-y-[var(--space-1)]">
                    <div className="font-medium text-[color:var(--text-primary)] flex items-center gap-[var(--space-2)]">
                      Help me plan this project
                      <Sparkles className="w-4 h-4 text-[color:var(--primary)]" />
                    </div>
                    <div className="text-sm text-[color:var(--text-secondary)]">
                      AI will suggest phases, milestones, and starter tasks
                    </div>
                  </div>
                </Label>
              </RadioGroup>
            </div>
            
            <DialogFooter className="pt-[var(--space-6)] border-t border-[var(--border-subtle)]">
              <div className="flex items-center justify-between w-full">
                <Button 
                  variant="ghost" 
                  onClick={() => setCurrentStep('basics')}
                  className="px-[var(--space-4)] h-10 text-[color:var(--text-secondary)] hover:text-[color:var(--text-primary)] hover:bg-[var(--bg-surface-elevated)]"
                >
                  <ChevronLeft className="w-4 h-4 mr-[var(--space-1)]" />
                  Back
                </Button>
                <Button 
                  onClick={handleMethodNext}
                  className="px-[var(--space-6)] h-10 bg-[var(--primary)] hover:bg-[var(--primary-hover)] text-white font-medium transition-all"
                >
                  {projectData.setupMethod === 'manual' ? 'Create project' : 'Next'}
                  {projectData.setupMethod === 'ai' && <ChevronRight className="w-4 h-4 ml-[var(--space-1)]" />}
                </Button>
              </div>
            </DialogFooter>
          </>
        )}

        {/* Step 3B: AI Prompt */}
        {currentStep === 'ai-prompt' && (
          <>
            <div className="space-y-[var(--space-6)] py-[var(--space-6)]">
              <div className="space-y-[var(--space-1)]">
                <h3 className="text-base font-semibold text-[color:var(--text-primary)]">
                  Tell me about your project
                </h3>
                <p className="text-sm text-[color:var(--text-secondary)]">
                  Describe what you want to accomplish, any constraints, timeline, or specific requirements.
                </p>
              </div>
              
              <div>
                <Textarea
                  id="aiPrompt"
                  placeholder=""
                  rows={6}
                  className="px-[var(--space-4)] py-[var(--space-4)] border border-[var(--border-default)] rounded-[var(--radius-md)] bg-[var(--bg-surface)] text-[color:var(--text-primary)] placeholder:text-[color:var(--text-secondary)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary-tint-10)] transition-all resize-none leading-relaxed"
                  value={projectData.aiPrompt || ''}
                  onChange={(e) => setProjectData({ ...projectData, aiPrompt: e.target.value.slice(0, 1000) })}
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
