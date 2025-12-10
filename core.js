// core.js - Application state management, routing, and view system
(function() {
  'use strict';

  // Global App namespace
  window.App = {
    state: {
      currentView: 'dashboard',
      user: { name: '', streak: 0, xp: 0 },
      courses: [],
      notes: [],
      tasks: [],
      exams: [],
      events: [],
      budget: { income: [], expenses: [] },
      resources: []
    },
    views: {},
    elements: {},
    
    // Initialize app
    bootstrap: function(elements) {
      this.elements = elements;
      this.loadState();
      this.render();
    },

    // Register a view module
    registerView: function(name, viewObject) {
      this.views[name] = viewObject;
    },

    // Navigate to a view
    navigate: function(viewName) {
      this.state.currentView = viewName;
      this.render();
      this.saveState();
    },

    // Render current view
    render: function() {
      const view = this.views[this.state.currentView];
      if (view && view.render && this.elements.viewRoot) {
        this.elements.viewRoot.innerHTML = '';
        view.render(this.elements.viewRoot, this.state);
      }
      
      // Update context and details panes
      this.updateContextPane();
      this.updateDetailsPane();
      this.updateStatus();
    },

    // Update context sidebar (left pane)
    updateContextPane: function() {
      if (!this.elements.contextPane) return;
      
      const view = this.views[this.state.currentView];
      if (view && view.renderContext) {
        this.elements.contextPane.innerHTML = '';
        view.renderContext(this.elements.contextPane, this.state);
      } else {
        this.elements.contextPane.innerHTML = '<p style="color: #9ca3af; font-size: 12px; padding: 8px;">No context available</p>';
      }
    },

    // Update details sidebar (right pane)
    updateDetailsPane: function() {
      if (!this.elements.detailsPane) return;
      
      const view = this.views[this.state.currentView];
      if (view && view.renderDetails) {
        this.elements.detailsPane.innerHTML = '';
        view.renderDetails(this.elements.detailsPane, this.state);
      } else {
        this.elements.detailsPane.innerHTML = '<p style="color: #9ca3af; font-size: 12px; padding: 8px;">No details available</p>';
      }
    },

    // Update status bar
    updateStatus: function() {
      if (this.elements.streakEl) {
        this.elements.streakEl.textContent = `Streak · ${this.state.user.streak} days`;
      }
      if (this.elements.xpEl) {
        this.elements.xpEl.textContent = `XP · ${this.state.user.xp}`;
      }
    },

    // Add new item in current view
    addNewInCurrentView: function() {
      const view = this.views[this.state.currentView];
      if (view && view.addNew) {
        view.addNew(this.state);
        this.render();
        this.saveState();
      }
    },

    // Set global filter
    setGlobalFilter: function(query) {
      this.state.globalFilter = query;
      this.render();
    },

    // Load state from localStorage
    loadState: function() {
      try {
        const saved = localStorage.getItem('studentPalState');
        if (saved) {
          const parsed = JSON.parse(saved);
          this.state = { ...this.state, ...parsed };
        }
      } catch (e) {
        console.error('Failed to load state:', e);
      }
    },

    // Save state to localStorage
    saveState: function() {
      try {
        localStorage.setItem('studentPalState', JSON.stringify(this.state));
        if (this.elements.statusTextEl) {
          this.elements.statusTextEl.textContent = 'Local vault · All changes saved';
        }
      } catch (e) {
        console.error('Failed to save state:', e);
      }
    },

    // Helper: Generate unique ID
    generateId: function() {
      return Date.now().toString(36) + Math.random().toString(36).substr(2);
    },

    // Helper: Format date
    formatDate: function(date) {
      if (!date) return '';
      const d = new Date(date);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    },

    // Helper: Calculate days until
    daysUntil: function(date) {
      if (!date) return null;
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const target = new Date(date);
      target.setHours(0, 0, 0, 0);
      const diff = Math.ceil((target - today) / (1000 * 60 * 60 * 24));
      return diff;
    }
  };

  // Register default dashboard view
  App.registerView('dashboard', {
    render: function(root, state) {
      const upcomingTasks = state.tasks.filter(t => !t.completed).slice(0, 5);
      const upcomingExams = state.exams.slice(0, 3);
      
      root.innerHTML = `
        <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 12px; padding: 8px;">
          <div class="card">
            <div class="card-header">
              <span class="card-title">Quick Stats</span>
            </div>
            <div style="display: flex; flex-direction: column; gap: 8px; margin-top: 8px;">
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #9ca3af;">Courses</span>
                <span style="color: #f9fafb; font-weight: 600;">${state.courses.length}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #9ca3af;">Notes</span>
                <span style="color: #f9fafb; font-weight: 600;">${state.notes.length}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #9ca3af;">Tasks</span>
                <span style="color: #f9fafb; font-weight: 600;">${state.tasks.length}</span>
              </div>
              <div style="display: flex; justify-content: space-between; font-size: 12px;">
                <span style="color: #9ca3af;">Exams</span>
                <span style="color: #f9fafb; font-weight: 600;">${state.exams.length}</span>
              </div>
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <span class="card-title">Upcoming Tasks</span>
            </div>
            <div style="margin-top: 8px;">
              ${upcomingTasks.length === 0 ? 
                '<p style="color: #9ca3af; font-size: 12px;">No pending tasks</p>' : 
                upcomingTasks.map(t => `
                  <div style="padding: 6px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); font-size: 12px;">
                    <span style="color: #f9fafb;">${t.title}</span>
                  </div>
                `).join('')
              }
            </div>
          </div>
          
          <div class="card">
            <div class="card-header">
              <span class="card-title">Upcoming Exams</span>
            </div>
            <div style="margin-top: 8px;">
              ${upcomingExams.length === 0 ? 
                '<p style="color: #9ca3af; font-size: 12px;">No upcoming exams</p>' : 
                upcomingExams.map(e => `
                  <div style="padding: 6px 0; border-bottom: 1px solid rgba(148, 163, 184, 0.2); font-size: 12px;">
                    <span style="color: #f9fafb;">${e.title}</span>
                    <br>
                    <span style="color: #9ca3af; font-size: 11px;">${App.formatDate(e.date)}</span>
                  </div>
                `).join('')
              }
            </div>
          </div>
        </div>
      `;
    },
    
    renderContext: function(root, state) {
      root.innerHTML = `
        <div style="padding: 8px; font-size: 12px; color: #9ca3af;">
          <p>Welcome to Student Pal</p>
          <p style="margin-top: 8px;">Your local-first learner hub for courses, notes, tasks, and exams.</p>
        </div>
      `;
    },
    
    renderDetails: function(root, state) {
      const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
      root.innerHTML = `
        <div style="padding: 8px; font-size: 12px;">
          <p style="color: #f9fafb; font-weight: 600; margin-bottom: 8px;">${today}</p>
          <div style="color: #9ca3af; display: flex; flex-direction: column; gap: 6px;">
            <div>Streak: ${state.user.streak} days</div>
            <div>XP: ${state.user.xp}</div>
            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid rgba(148, 163, 184, 0.2);">
              Keep learning consistently to build your streak!
            </div>
          </div>
        </div>
      `;
    }
  });

})();
