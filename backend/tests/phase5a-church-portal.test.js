const { ChurchPortalSettings, ChurchContentTypeConfig, ChurchContent, ChurchContentView } = require('../models');

describe('Phase 5a Model Existence Tests', () => {
    test('ChurchPortalSettings model should exist', () => {
        expect(ChurchPortalSettings).toBeDefined();
    });

    test('ChurchContentTypeConfig model should exist', () => {
        expect(ChurchContentTypeConfig).toBeDefined();
    });

    test('ChurchContent model should exist', () => {
        expect(ChurchContent).toBeDefined();
    });

    test('ChurchContentView model should exist', () => {
        expect(ChurchContentView).toBeDefined();
    });

    test('Models can be instantiated (basic check)', () => {
        const settings = new ChurchPortalSettings();
        const config = new ChurchContentTypeConfig();
        const content = new ChurchContent();
        const view = new ChurchContentView();
        
        expect(settings).toBeInstanceOf(ChurchPortalSettings);
        expect(config).toBeInstanceOf(ChurchContentTypeConfig);
        expect(content).toBeInstanceOf(ChurchContent);
        expect(view).toBeInstanceOf(ChurchContentView);
    });
});
