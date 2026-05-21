'use strict';

/**
 * Model: ChurchPortalSettings
 * Purpose: Store portal branding, configuration, and domain settings per church
 * Table: church_portal_settings (13 columns)
 * Relationships: belongsTo Church
 * Features: Subdomain routing, custom branding, portal configuration, SEO settings
 * Phase: 5a - Church Portal System
 */

module.exports = (sequelize, DataTypes) => {
  const ChurchPortalSettings = sequelize.define(
    'ChurchPortalSettings',
    {
      id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      churchId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
          model: 'churches',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
        unique: true, // One settings record per church
        comment: 'Foreign key: Church (unique)',
      },
      portalTitle: {
        type: DataTypes.STRING(255),
        allowNull: true,
        comment: 'Custom title for church portal (e.g., "First Baptist Church")',
      },
      portalDescription: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Short description for portal SEO and display',
      },
      portalLogoUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
        comment: 'URL to church logo for portal header',
      },
      heroImageUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
        comment: 'URL to hero banner image for portal homepage',
      },
      subdomain: {
        type: DataTypes.STRING(63),
        allowNull: true,
        unique: true,
        validate: {
          is: /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/i,
        },
        comment: 'Subdomain for portal (e.g., "firstbaptist" → firstbaptist.elyonsys.com)',
      },
      customDomain: {
        type: DataTypes.STRING(255),
        allowNull: true,
        unique: true,
        comment: 'Optional custom domain (e.g., "firstbaptist.org") - Phase 6 feature',
      },
      itemsPerPage: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
        validate: {
          min: 1,
          max: 100,
        },
        comment: 'Number of content items per page in portal lists',
      },
      enableComments: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Allow members to comment on portal content',
      },
      enableSearch: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Enable portal search functionality',
      },
      socialMediaLinks: {
        type: DataTypes.JSON,
        allowNull: true,
        defaultValue: {},
        comment: 'JSON object with social media links {facebook, twitter, instagram, youtube}',
      },
      googleAnalyticsId: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isCorrectFormat: function (value) {
            if (value && !/(^UA-\d{4,9}-\d{1,4}$)|(^G-[A-Z0-9]{10}$)/.test(value)) {
              throw new Error(
                'Invalid Google Analytics ID format'
              );
            }
          },
        },
        comment: 'Google Analytics ID (UA-XXXXXXXX-X or G-XXXXXXXX)',
      },
      footerText: {
        type: DataTypes.TEXT,
        allowNull: true,
        comment: 'Custom footer text for portal',
      },
      privacyPolicyUrl: {
        type: DataTypes.STRING(500),
        allowNull: true,
        validate: {
          isUrl: true,
        },
        comment: 'URL to church privacy policy',
      },
      contactEmail: {
        type: DataTypes.STRING(255),
        allowNull: true,
        validate: {
          isEmail: true,
        },
        comment: 'Email for portal contact form submissions',
      },
      createdAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      updatedAt: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
    },
    {
      sequelize,
      modelName: 'ChurchPortalSettings',
      tableName: 'church_portal_settings',
      timestamps: true,
      indexes: [
        {
          fields: ['churchId'],
          name: 'idx_portal_settings_churchId',
        },
      ],
    }
  );

  // ============================================================================
  // ASSOCIATIONS
  // ============================================================================

  ChurchPortalSettings.associate = (models) => {
    // Settings belong to a Church
    ChurchPortalSettings.belongsTo(models.Church, {
      foreignKey: 'churchId',
      as: 'church',
      onDelete: 'CASCADE',
      onUpdate: 'CASCADE',
    });
  };

  // ============================================================================
  // INSTANCE METHODS
  // ============================================================================

  /**
   * Get effective portal title
   * Returns: portalTitle if set, else church name
   */
  ChurchPortalSettings.prototype.getEffectiveTitle = function (churchName) {
    return this.portalTitle || churchName || 'Church Portal';
  };

  /**
   * Get effective portal description
   * Returns: portalDescription if set, else default
   */
  ChurchPortalSettings.prototype.getEffectiveDescription = function () {
    return (
      this.portalDescription ||
      'Welcome to our church portal. Discover sermons, events, and community updates.'
    );
  };

  /**
   * Get portal URL (subdomain or custom domain)
   * Params: baseDomain (e.g., "elyonsys.com")
   * Returns: Full URL string
   */
  ChurchPortalSettings.prototype.getPortalUrl = function (baseDomain = 'elyonsys.com') {
    if (this.customDomain) {
      return `https://${this.customDomain}`;
    }
    if (this.subdomain) {
      return `https://${this.subdomain}.${baseDomain}`;
    }
    return null;
  };

  /**
   * Get portal domain (for routing)
   * Returns: subdomain or customDomain
   */
  ChurchPortalSettings.prototype.getPortalDomain = function () {
    return this.customDomain || this.subdomain;
  };

  /**
   * Check if portal is publicly accessible
   * Returns: true if either subdomain or customDomain is set
   */
  ChurchPortalSettings.prototype.isPortalEnabled = function () {
    return !!(this.subdomain || this.customDomain);
  };

  /**
   * Get portal branding data for frontend
   * Returns: { title, description, logo, hero, social }
   */
  ChurchPortalSettings.prototype.getBrandingData = function (churchName) {
    return {
      title: this.getEffectiveTitle(churchName),
      description: this.getEffectiveDescription(),
      logo: this.portalLogoUrl,
      hero: this.heroImageUrl,
      social: this.socialMediaLinks || {},
      year: new Date().getFullYear(),
    };
  };

  /**
   * Get portal configuration for API responses
   * Returns: { branding, features, seo, contact }
   */
  ChurchPortalSettings.prototype.getConfiguration = function (churchName) {
    return {
      branding: {
        title: this.getEffectiveTitle(churchName),
        description: this.getEffectiveDescription(),
        logo: this.portalLogoUrl,
        heroImage: this.heroImageUrl,
      },
      features: {
        enableComments: this.enableComments,
        enableSearch: this.enableSearch,
        itemsPerPage: this.itemsPerPage,
      },
      seo: {
        analyticsId: this.googleAnalyticsId,
      },
      legal: {
        footerText: this.footerText,
        privacyPolicyUrl: this.privacyPolicyUrl,
        contactEmail: this.contactEmail,
      },
    };
  };

  /**
   * Update portal branding
   * Params: { portalTitle, portalDescription, logoUrl, heroImageUrl }
   * Returns: this
   */
  ChurchPortalSettings.prototype.updateBranding = function (branding) {
    if (branding.portalTitle) this.portalTitle = branding.portalTitle;
    if (branding.portalDescription)
      this.portalDescription = branding.portalDescription;
    if (branding.portalLogoUrl) this.portalLogoUrl = branding.portalLogoUrl;
    if (branding.heroImageUrl) this.heroImageUrl = branding.heroImageUrl;
    return this;
  };

  /**
   * Update portal features
   * Params: { enableComments, enableSearch, itemsPerPage }
   * Returns: this
   */
  ChurchPortalSettings.prototype.updateFeatures = function (features) {
    if (features.enableComments !== undefined)
      this.enableComments = features.enableComments;
    if (features.enableSearch !== undefined)
      this.enableSearch = features.enableSearch;
    if (features.itemsPerPage !== undefined)
      this.itemsPerPage = features.itemsPerPage;
    return this;
  };

  /**
   * Update social media links
   * Params: { facebook, twitter, instagram, youtube, ... }
   * Returns: this
   */
  ChurchPortalSettings.prototype.updateSocialMedia = function (links) {
    this.socialMediaLinks = { ...this.socialMediaLinks, ...links };
    return this;
  };

  /**
   * Get social media links
   * Returns: { facebook, twitter, instagram, youtube, ... }
   */
  ChurchPortalSettings.prototype.getSocialMediaLinks = function () {
    return this.socialMediaLinks || {};
  };

  /**
   * Check if church has a social media link
   * Params: platform (facebook, twitter, instagram, youtube)
   * Returns: boolean
   */
  ChurchPortalSettings.prototype.hasSocialMedia = function (platform) {
    return !!(this.socialMediaLinks && this.socialMediaLinks[platform]);
  };

  /**
   * Set subdomain
   * Params: subdomain string (validated)
   * Returns: this
   */
  ChurchPortalSettings.prototype.setSubdomain = function (subdomain) {
    this.subdomain = subdomain ? subdomain.toLowerCase() : null;
    return this;
  };

  /**
   * Set custom domain
   * Params: domain string (validated)
   * Returns: this
   */
  ChurchPortalSettings.prototype.setCustomDomain = function (domain) {
    this.customDomain = domain ? domain.toLowerCase() : null;
    return this;
  };

  // ============================================================================
  // CLASS METHODS (STATIC)
  // ============================================================================

  /**
   * Find settings by subdomain
   * Params: subdomain
   * Returns: ChurchPortalSettings or null
   */
  ChurchPortalSettings.findBySubdomain = async function (subdomain) {
    return this.findOne({
      where: { subdomain: subdomain.toLowerCase() },
    });
  };

  /**
   * Find settings by custom domain
   * Params: customDomain
   * Returns: ChurchPortalSettings or null
   */
  ChurchPortalSettings.findByCustomDomain = async function (customDomain) {
    return this.findOne({
      where: { customDomain: customDomain.toLowerCase() },
    });
  };

  /**
   * Find settings by domain (checks both subdomain and customDomain)
   * Params: domain
   * Returns: ChurchPortalSettings or null
   */
  ChurchPortalSettings.findByDomain = async function (domain) {
    return this.findOne({
      where: {
        [sequelize.Op.or]: [
          { subdomain: domain.toLowerCase() },
          { customDomain: domain.toLowerCase() },
        ],
      },
    });
  };

  /**
   * Check if subdomain is available
   * Params: subdomain
   * Returns: boolean
   */
  ChurchPortalSettings.isSubdomainAvailable = async function (subdomain) {
    const existing = await this.findOne({
      where: { subdomain: subdomain.toLowerCase() },
    });
    return !existing;
  };

  /**
   * Check if custom domain is available
   * Params: customDomain
   * Returns: boolean
   */
  ChurchPortalSettings.isCustomDomainAvailable = async function (customDomain) {
    const existing = await this.findOne({
      where: { customDomain: customDomain.toLowerCase() },
    });
    return !existing;
  };

  /**
   * Get or create settings for a church
   * Params: churchId
   * Returns: ChurchPortalSettings
   */
  ChurchPortalSettings.getOrCreate = async function (churchId) {
    const [settings] = await this.findOrCreate({
      where: { churchId },
      defaults: {
        churchId,
        itemsPerPage: 10,
        enableComments: false,
        enableSearch: true,
      },
    });
    return settings;
  };

  /**
   * Get settings by church ID
   * Params: churchId
   * Returns: ChurchPortalSettings or null
   */
  ChurchPortalSettings.getByChurchId = async function (churchId) {
    return this.findOne({
      where: { churchId },
    });
  };

  /**
   * Get all active portals (with subdomain or customDomain set)
   * Params: limit, offset
   * Returns: Array of ChurchPortalSettings
   */
  ChurchPortalSettings.getActivePortals = async function (limit = 100, offset = 0) {
    return this.findAll({
      where: {
        [sequelize.Op.or]: [
          { subdomain: { [sequelize.Op.not]: null } },
          { customDomain: { [sequelize.Op.not]: null } },
        ],
      },
      limit,
      offset,
      order: [['createdAt', 'DESC']],
    });
  };

  /**
   * Get portal statistics
   * Returns: { totalChurches, activePortals, withSubdomains, withCustomDomains }
   */
  ChurchPortalSettings.getPortalStats = async function () {
    const totalChurches = await this.count();

    const activePortals = await this.count({
      where: {
        [sequelize.Op.or]: [
          { subdomain: { [sequelize.Op.not]: null } },
          { customDomain: { [sequelize.Op.not]: null } },
        ],
      },
    });

    const withSubdomains = await this.count({
      where: { subdomain: { [sequelize.Op.not]: null } },
    });

    const withCustomDomains = await this.count({
      where: { customDomain: { [sequelize.Op.not]: null } },
    });

    return {
      totalChurches,
      activePortals,
      withSubdomains,
      withCustomDomains,
    };
  };

  /**
   * Initialize default settings for a new church
   * Params: churchId
   * Returns: Created ChurchPortalSettings
   */
  ChurchPortalSettings.initializeDefaults = async function (churchId) {
    return this.create({
      churchId,
      itemsPerPage: 10,
      enableComments: false,
      enableSearch: true,
      socialMediaLinks: {},
    });
  };

  return ChurchPortalSettings;
};
