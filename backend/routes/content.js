const express = require('express');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const path = require('path');
const fs = require('fs');

const { upload, handleUploadError } = require('../middleware/upload');
const contentProcessor = require('../services/contentProcessor');
const { protect } = require('../middleware/auth');
const Trainer = require('../models/Trainer');
const TrainerFlow = require('../models/TrainerFlow');

const router = express.Router();

router.use(protect);

// Upload training materials
router.post('/upload', 
  upload.array('files', 10),
  handleUploadError,
  asyncHandler(async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No files uploaded'
      });
    }

    const { trainerId } = req.body;
    const uploadedFiles = [];

    try {
      for (const file of req.files) {
        // Process the uploaded file
        const processResult = await contentProcessor.processFile(file.path, file.mimetype);
        
        if (processResult.success) {
          // Extract key information
          const keyInfo = contentProcessor.extractKeyInformation(
            processResult.extractedText, 
            file.mimetype
          );
          
          // Generate content suggestions
          const suggestions = contentProcessor.generateContentSuggestions(
            processResult.extractedText, 
            file.mimetype
          );

          uploadedFiles.push({
            originalName: file.originalname,
            filename: file.filename,
            path: file.path,
            size: file.size,
            mimetype: file.mimetype,
            processedContent: processResult.content,
            extractedText: processResult.extractedText,
            metadata: processResult.metadata,
            keyInformation: keyInfo,
            suggestions: suggestions,
            uploadedAt: new Date()
          });
        } else {
          // Remove failed file
          if (fs.existsSync(file.path)) {
            fs.unlinkSync(file.path);
          }
          
          uploadedFiles.push({
            originalName: file.originalname,
            error: processResult.error,
            uploadedAt: new Date()
          });
        }
      }

      res.status(200).json({
        success: true,
        message: 'Files uploaded and processed successfully',
        data: {
          files: uploadedFiles,
          totalFiles: uploadedFiles.length,
          successfulUploads: uploadedFiles.filter(f => !f.error).length,
          failedUploads: uploadedFiles.filter(f => f.error).length
        }
      });
    } catch (error) {
      // Clean up uploaded files on error
      req.files.forEach(file => {
        if (fs.existsSync(file.path)) {
          fs.unlinkSync(file.path);
        }
      });
      
      throw error;
    }
  })
);

// Get processed content for a trainer
router.get('/trainer/:trainerId', asyncHandler(async (req, res) => {
  const { trainerId } = req.params;
  
  // Verify trainer exists and user has access
  const trainer = await Trainer.findById(trainerId);
  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this trainer'
    });
  }

  // Get trainer flow to see what content is already integrated
  const flows = await TrainerFlow.find({ trainerId: trainer._id });
  
  res.status(200).json({
    success: true,
    data: {
      trainer: {
        id: trainer._id,
        name: trainer.name,
        type: trainer.type
      },
      flows: flows.map(flow => ({
        id: flow._id,
        name: flow.name,
        version: flow.version,
        isPublished: flow.isPublished,
        totalNodes: flow.metadata.totalNodes,
        totalEdges: flow.metadata.totalEdges
      })),
      contentStats: {
        totalFlows: flows.length,
        publishedFlows: flows.filter(f => f.isPublished).length,
        totalNodes: flows.reduce((sum, f) => sum + f.metadata.totalNodes, 0)
      }
    }
  });
}));

// Generate flow structure from uploaded content
router.post('/generate-flow', asyncHandler(async (req, res) => {
  const { trainerId, contentFiles, flowName } = req.body;
  
  if (!trainerId || !contentFiles || !flowName) {
    return res.status(400).json({
      success: false,
      message: 'Missing required fields: trainerId, contentFiles, flowName'
    });
  }

  // Verify trainer exists and user has access
  const trainer = await Trainer.findById(trainerId);
  if (!trainer) {
    return res.status(404).json({
      success: false,
      message: 'Trainer not found'
    });
  }

  if (!trainer.canBeAccessedBy(req.user.id)) {
    return res.status(403).json({
      success: false,
      message: 'Not authorized to access this trainer'
    });
  }

  try {
    // Generate flow structure based on content
    const flowStructure = await generateFlowFromContent(contentFiles, trainer.type);
    
    // Create new flow
    const newFlow = await TrainerFlow.create({
      trainerId: trainer._id,
      name: flowName,
      version: '1.0.0',
      nodes: flowStructure.nodes,
      edges: flowStructure.edges,
      settings: {
        startNode: flowStructure.startNode,
        endNodes: flowStructure.endNodes,
        maxDepth: flowStructure.maxDepth || 10,
        allowLoops: false
      },
      metadata: {
        totalNodes: flowStructure.nodes.length,
        totalEdges: flowStructure.edges.length,
        complexity: flowStructure.complexity || 'low',
        estimatedDuration: flowStructure.estimatedDuration || 0
      }
    });

    res.status(201).json({
      success: true,
      message: 'Flow generated successfully',
      data: {
        flow: newFlow,
        suggestions: flowStructure.suggestions
      }
    });
  } catch (error) {
    console.error('Error generating flow:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to generate flow structure',
      error: error.message
    });
  }
}));

// Helper function to generate flow structure from content
async function generateFlowFromContent(contentFiles, trainerType) {
  const nodes = [];
  const edges = [];
  let nodeId = 1;
  
  // Add start node
  const startNode = {
    id: `n${nodeId++}`,
    type: 'start',
    label: 'Start Training',
    x: 100,
    y: 100,
    w: 150,
    h: 60,
    data: {
      textDraft: 'Welcome to the training session. Let\'s begin!',
      messages: ['Welcome to the training session. Let\'s begin!']
    }
  };
  nodes.push(startNode);
  
  // Process content files and create nodes
  let currentX = 100;
  let currentY = 200;
  
  for (const file of contentFiles) {
    if (file.extractedText && file.extractedText.length > 0) {
      // Create content node
      const contentNode = {
        id: `n${nodeId++}`,
        type: 'text',
        label: `Content: ${file.originalName}`,
        x: currentX,
        y: currentY,
        w: 200,
        h: 120,
        data: {
          textDraft: file.extractedText.substring(0, 500) + (file.extractedText.length > 500 ? '...' : ''),
          messages: [file.extractedText.substring(0, 500) + (file.extractedText.length > 500 ? '...' : '')]
        }
      };
      nodes.push(contentNode);
      
      // Connect to previous node
      if (nodes.length > 1) {
        const edge = {
          id: `e${edges.length + 1}`,
          from: nodes[nodes.length - 2].id,
          to: contentNode.id,
          label: 'Next',
          condition: {
            type: 'auto'
          }
        };
        edges.push(edge);
      }
      
      // Add question node if content is substantial
      if (file.extractedText.length > 200) {
        const questionNode = {
          id: `n${nodeId++}`,
          type: 'question',
          label: 'Understanding Check',
          x: currentX + 300,
          y: currentY,
          w: 180,
          h: 100,
          data: {
            textDraft: 'Do you understand the content covered so far?',
            messages: ['Do you understand the content covered so far?'],
            choices: ['Yes, I understand', 'I need clarification', 'Let me review']
          }
        };
        nodes.push(questionNode);
        
        // Connect content to question
        const questionEdge = {
          id: `e${edges.length + 1}`,
          from: contentNode.id,
          to: questionNode.id,
          label: 'Check Understanding',
          condition: {
            type: 'question'
          }
        };
        edges.push(questionEdge);
        
        currentY += 150;
      }
      
      currentX += 350;
      currentY += 150;
    }
  }
  
  // Add end node
  const endNode = {
    id: `n${nodeId++}`,
    type: 'end',
    label: 'Training Complete',
    x: currentX,
    y: currentY,
    w: 150,
    h: 60,
    data: {
      textDraft: 'Congratulations! You have completed the training session.',
      messages: ['Congratulations! You have completed the training session.']
    }
  };
  nodes.push(endNode);
  
  // Connect last content node to end
  if (nodes.length > 1) {
    const finalEdge = {
      id: `e${edges.length + 1}`,
      from: nodes[nodes.length - 2].id,
      to: endNode.id,
      label: 'Complete',
      condition: {
        type: 'auto'
      }
    };
    edges.push(finalEdge);
  }
  
  return {
    nodes,
    edges,
    startNode: startNode.id,
    endNodes: [endNode.id],
    maxDepth: Math.ceil(nodes.length / 2),
    complexity: nodes.length > 10 ? 'medium' : 'low',
    estimatedDuration: Math.ceil(nodes.length * 2),
    suggestions: [
      'Consider adding more interactive elements like decision nodes',
      'Break down longer content into smaller chunks',
      'Add assessment nodes to test knowledge retention'
    ]
  }
}

// Delete uploaded content
router.delete('/:filename', asyncHandler(async (req, res) => {
  const { filename } = req.params;
  const filePath = path.join(__dirname, '../uploads/training-materials', filename);
  
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({
      success: false,
      message: 'File not found'
    });
  }
  
  try {
    fs.unlinkSync(filePath);
    res.status(200).json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to delete file',
      error: error.message
    });
  }
}));

module.exports = router;
