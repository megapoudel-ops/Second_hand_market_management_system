const Template = require('../models/template.model');
const ApiError = require('../utils/apiError');
const asyncHandler = require('../utils/asyncHandler');
const { success } = require('../utils/apiResponse');

const createTemplate = asyncHandler(async (req, res) => {
  const template = await Template.create(req.body);
  success(res, 201, 'Template created successfully', template);
});

const getTemplates = asyncHandler(async (_req, res) => {
  const templates = await Template.find().sort({ createdAt: -1 });
  success(res, 200, 'Templates fetched successfully', templates);
});

const getTemplate = asyncHandler(async (req, res) => {
  const template = await Template.findOne({ key: req.params.key });

  if (!template) {
    throw new ApiError(404, 'Template not found');
  }

  success(res, 200, 'Template fetched successfully', template);
});

module.exports = { createTemplate, getTemplates, getTemplate };
