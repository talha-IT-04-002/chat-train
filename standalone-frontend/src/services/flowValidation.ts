export interface FlowNode {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  data: any;
}

export interface FlowEdge {
  id: string;
  from: string;
  to: string;
  label?: string;
  condition?: any;
}

export interface FlowValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  suggestions: string[];
}

export class FlowValidator {
  /**
   * Validate the entire flow structure
   */
  static validateFlow(nodes: FlowNode[], edges: FlowEdge[]): FlowValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check for basic structure
    if (nodes.length === 0) {
      errors.push('Flow must contain at least one node');
      return { isValid: false, errors, warnings, suggestions };
    }

    // Validate start nodes
    const startNodes = nodes.filter(node => node.type === 'start');
    if (startNodes.length === 0) {
      errors.push('Flow must have exactly one start node');
    } else if (startNodes.length > 1) {
      errors.push('Flow can only have one start node');
    }

    // Validate end nodes
    const endNodes = nodes.filter(node => node.type === 'end' || node.type === 'completion');
    if (endNodes.length === 0) {
      errors.push('Flow must have at least one end/completion node');
    }

    // Validate node connections
    const connectedNodeIds = new Set<string>();
    edges.forEach(edge => {
      connectedNodeIds.add(edge.from);
      connectedNodeIds.add(edge.to);
    });

    // Check for orphaned nodes
    nodes.forEach(node => {
      if (node.type !== 'start' && node.type !== 'end' && node.type !== 'completion') {
        if (!connectedNodeIds.has(node.id)) {
          warnings.push(`Node "${node.label}" is not connected to the flow`);
        }
      }
    });

    // Validate edge connections
    edges.forEach(edge => {
      const fromNode = nodes.find(n => n.id === edge.from);
      const toNode = nodes.find(n => n.id === edge.to);

      if (!fromNode) {
        errors.push(`Edge references non-existent source node: ${edge.from}`);
      }
      if (!toNode) {
        errors.push(`Edge references non-existent target node: ${edge.to}`);
      }

      // Check for self-loops
      if (edge.from === edge.to) {
        warnings.push(`Node "${fromNode?.label}" has a self-loop`);
      }
    });

    // Check for cycles
    if (this.hasCycles(nodes, edges)) {
      warnings.push('Flow contains cycles which may cause infinite loops');
    }

    // Validate specific node types
    nodes.forEach(node => {
      const nodeErrors = this.validateNode(node, nodes, edges);
      errors.push(...nodeErrors.errors);
      warnings.push(...nodeErrors.warnings);
      suggestions.push(...nodeErrors.suggestions);
    });

    // Generate suggestions
    if (nodes.length < 5) {
      suggestions.push('Consider adding more nodes to create a comprehensive training flow');
    }

    if (endNodes.length === 1 && startNodes.length === 1) {
      suggestions.push('Consider adding intermediate nodes for better user engagement');
    }

    const questionNodes = nodes.filter(n => n.type === 'question');
    if (questionNodes.length === 0) {
      suggestions.push('Add question nodes to test user understanding');
    }

    const decisionNodes = nodes.filter(n => n.type === 'decision');
    if (decisionNodes.length === 0) {
      suggestions.push('Add decision nodes for conditional logic and branching');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      suggestions
    };
  }

  /**
   * Validate individual node
   */
  private static validateNode(node: FlowNode, allNodes: FlowNode[], allEdges: FlowEdge[]): {
    errors: string[];
    warnings: string[];
    suggestions: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    const suggestions: string[] = [];

    // Check node data
    if (!node.data || !node.data.textDraft) {
      warnings.push(`Node "${node.label}" has no content`);
    }

    // Type-specific validation
    switch (node.type) {
      case 'start': {
        const outgoingEdges = allEdges.filter(e => e.from === node.id);
        if (outgoingEdges.length === 0) {
          errors.push(`Start node "${node.label}" has no outgoing connections`);
        }
        break;
      }

      case 'end':
      case 'completion': {
        const incomingEdges = allEdges.filter(e => e.to === node.id);
        if (incomingEdges.length === 0) {
          errors.push(`End node "${node.label}" has no incoming connections`);
        }
        break;
      }

      case 'question': {
        if (!node.data.choices || node.data.choices.length === 0) {
          warnings.push(`Question node "${node.label}" has no answer choices`);
        }
        if (node.data.choices && node.data.choices.length < 2) {
          warnings.push(`Question node "${node.label}" should have at least 2 answer choices`);
        }
        break;
      }

      case 'decision': {
        const outgoingEdges = allEdges.filter(e => e.from === node.id);
        if (outgoingEdges.length < 2) {
          warnings.push(`Decision node "${node.label}" should have at least 2 outgoing paths`);
        }
        break;
      }

      case 'assessment': {
        if (!node.data.validation) {
          suggestions.push(`Assessment node "${node.label}" should include validation rules`);
        }
        break;
      }
    }

    return { errors, warnings, suggestions };
  }

  /**
   * Check for cycles in the flow
   */
  private static hasCycles(nodes: FlowNode[], edges: FlowEdge[]): boolean {
    const visited = new Set<string>();
    const recStack = new Set<string>();

    const hasCycleDFS = (nodeId: string): boolean => {
      if (recStack.has(nodeId)) return true;
      if (visited.has(nodeId)) return false;

      visited.add(nodeId);
      recStack.add(nodeId);

      const outgoingEdges = edges.filter(edge => edge.from === nodeId);
      for (const edge of outgoingEdges) {
        if (hasCycleDFS(edge.to)) return true;
      }

      recStack.delete(nodeId);
      return false;
    };

    for (const node of nodes) {
      if (!visited.has(node.id)) {
        if (hasCycleDFS(node.id)) return true;
      }
    }

    return false;
  }

  /**
   * Get flow statistics
   */
  static getFlowStats(nodes: FlowNode[], edges: FlowEdge[]) {
    const nodeTypeCounts: Record<string, number> = {};
    const totalConnections = edges.length;
    const avgConnectionsPerNode = nodes.length > 0 ? totalConnections / nodes.length : 0;

    nodes.forEach(node => {
      nodeTypeCounts[node.type] = (nodeTypeCounts[node.type] || 0) + 1;
    });

    return {
      totalNodes: nodes.length,
      totalEdges: edges.length,
      nodeTypeCounts,
      avgConnectionsPerNode: Math.round(avgConnectionsPerNode * 100) / 100,
      complexity: this.calculateComplexity(nodes.length, edges.length)
    };
  }

  /**
   * Calculate flow complexity
   */
  private static calculateComplexity(nodeCount: number, edgeCount: number): 'low' | 'medium' | 'high' {
    const totalElements = nodeCount + edgeCount;
    if (totalElements <= 10) return 'low';
    if (totalElements <= 30) return 'medium';
    return 'high';
  }

  /**
   * Estimate training duration
   */
  static estimateDuration(nodes: FlowNode[], edges: FlowEdge[]): number {
    let baseTime = 0;
    
    nodes.forEach(node => {
      switch (node.type) {
        case 'start':
        case 'end':
        case 'completion':
          baseTime += 0.5; // 30 seconds
          break;
        case 'text':
        case 'content': {
          const contentLength = node.data?.textDraft?.length || 0;
          baseTime += Math.max(1, Math.ceil(contentLength / 200)); // 1 min per 200 chars
          break;
        }
        case 'question':
          baseTime += 2; // 2 minutes for questions
          break;
        case 'decision':
          baseTime += 1; // 1 minute for decisions
          break;
        case 'assessment':
          baseTime += 3; // 3 minutes for assessments
          break;
        default:
          baseTime += 1; // 1 minute default
      }
    });

    // Add time for navigation between nodes
    baseTime += edges.length * 0.2;

    return Math.ceil(baseTime);
  }

  /**
   * Generate flow optimization suggestions
   */
  static generateOptimizationSuggestions(nodes: FlowNode[], edges: FlowEdge[]): string[] {
    const suggestions: string[] = [];
    const stats = this.getFlowStats(nodes, edges);

    if (stats.avgConnectionsPerNode < 1) {
      suggestions.push('Consider adding more connections between nodes for better flow');
    }

    if (stats.avgConnectionsPerNode > 3) {
      suggestions.push('Flow may be too complex - consider simplifying the structure');
    }

    const questionNodes = nodes.filter(n => n.type === 'question');
    const assessmentNodes = nodes.filter(n => n.type === 'assessment');
    
    if (questionNodes.length === 0 && assessmentNodes.length === 0) {
      suggestions.push('Add interactive elements like questions or assessments to engage users');
    }

    const contentNodes = nodes.filter(n => n.type === 'text' || n.type === 'content');
    if (contentNodes.length > 10) {
      suggestions.push('Consider breaking down long content into smaller, digestible chunks');
    }

    return suggestions;
  }
}
