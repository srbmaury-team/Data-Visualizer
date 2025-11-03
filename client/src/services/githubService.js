/**
 * GitHub Repository Analysis Service
 * Fetches repository structure and metadata for visualization
 */

class GitHubService {
  constructor() {
    this.baseURL = 'https://api.github.com';
    this.cache = new Map();
  }

  /**
   * Parse GitHub URL and extract owner/repo
   */
  parseGitHubURL(url) {
    const patterns = [
      /github\.com\/([^/]+)\/([^/]+)(?:\.git)?(?:\/.*)?$/,
      /^([^/]+)\/([^/]+)$/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return {
          owner: match[1],
          repo: match[2].replace(/\.git$/, '')
        };
      }
    }
    
    throw new Error('Invalid GitHub URL format');
  }

  /**
   * Get repository metadata
   */
  async getRepositoryInfo(owner, repo) {
    const cacheKey = `repo-${owner}-${repo}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    const response = await fetch(`${this.baseURL}/repos/${owner}/${repo}`, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'YAML-Visualizer/1.0'
      }
    });
    
    if (!response.ok) {
      if (response.status === 403) {
        const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
        const rateLimitReset = response.headers.get('X-RateLimit-Reset');
        
        if (rateLimitRemaining === '0') {
          const resetTime = new Date(parseInt(rateLimitReset) * 1000);
          throw new Error(`GitHub API rate limit exceeded. Resets at ${resetTime.toLocaleTimeString()}`);
        }
        
        throw new Error('Access forbidden. Repository may be private or requires authentication.');
      }
      if (response.status === 404) {
        throw new Error('Repository not found or is private');
      }
      throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
    }

    const repoInfo = await response.json();
    this.cache.set(cacheKey, repoInfo);
    
    return repoInfo;
  }

  /**
   * Fetch repository tree structure recursively
   */
  async getRepositoryTree(owner, repo, path = '', maxDepth = 4, currentDepth = 0) {
    if (currentDepth >= maxDepth) {
      return { type: 'directory', name: '...', truncated: true };
    }

    const cacheKey = `tree-${owner}-${repo}-${path}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const url = `${this.baseURL}/repos/${owner}/${repo}/contents/${path}`;
      console.log(`Fetching: ${url} (depth: ${currentDepth})`);
      
      const response = await fetch(url, {
        headers: {
          'Accept': 'application/vnd.github.v3+json',
          'User-Agent': 'YAML-Visualizer/1.0'
        }
      });

      if (!response.ok) {
        if (response.status === 403) {
          const rateLimitRemaining = response.headers.get('X-RateLimit-Remaining');
          if (rateLimitRemaining === '0') {
            throw new Error('GitHub API rate limit exceeded. Please try again later.');
          }
          throw new Error('Access forbidden. Repository may be private.');
        }
        throw new Error(`Failed to fetch ${path}: ${response.status} ${response.statusText}`);
      }

      const contents = await response.json();
      console.log(`Got ${Array.isArray(contents) ? contents.length : 1} items for ${path || 'root'}`);
      
      // Handle single file
      if (!Array.isArray(contents)) {
        return this.processFile(contents);
      }

      // Process directory contents
      const tree = {
        type: 'directory',
        name: path || repo,
        size: 0,
        children: []
      };

      // Sort: directories first, then files
      const sorted = contents.sort((a, b) => {
        if (a.type !== b.type) {
          return a.type === 'dir' ? -1 : 1;
        }
        return a.name.localeCompare(b.name);
      });

      // Dynamic limit based on depth and repository size
      const getItemLimit = (depth, totalItems) => {
        if (depth === 0) return Math.min(totalItems, 25); // Root level: up to 25 items
        if (depth === 1) return Math.min(totalItems, 20); // First level: up to 20 items  
        if (depth === 2) return Math.min(totalItems, 15); // Second level: up to 15 items
        return Math.min(totalItems, 10); // Deeper levels: up to 10 items
      };

      const itemsToProcess = sorted.slice(0, getItemLimit(currentDepth, sorted.length));
      
      for (const item of itemsToProcess) {
        if (item.type === 'dir') {
          // Skip common build/dependency directories at deeper levels to save API calls
          const skipDirs = ['node_modules', '.git', 'dist', 'build', '__pycache__', '.next', '.nuxt', 'vendor'];
          if (currentDepth >= 2 && skipDirs.includes(item.name.toLowerCase())) {
            tree.children.push({
              type: 'directory',
              name: item.name,
              size: '(skipped)',
              children: []
            });
            continue;
          }

          // Recursively fetch subdirectories
          const subTree = await this.getRepositoryTree(
            owner, 
            repo, 
            item.path, 
            maxDepth, 
            currentDepth + 1
          );
          tree.children.push(subTree);
        } else {
          tree.children.push(this.processFile(item));
        }
        
        // Progressive delay based on depth to manage rate limits
        const delay = currentDepth === 0 ? 30 : currentDepth === 1 ? 50 : 80;
        await new Promise(resolve => setTimeout(resolve, delay));
      }

      console.log(`Processed tree for ${path || 'root'}: ${tree.children.length} children`);
      this.cache.set(cacheKey, tree);
      return tree;

    } catch (error) {
      console.warn(`Error fetching ${path}:`, error.message);
      return {
        type: 'directory',
        name: path || repo,
        error: error.message,
        children: []
      };
    }
  }

  /**
   * Process individual file metadata
   */
  processFile(file) {
    const extension = this.getFileExtension(file.name);
    const category = this.categorizeFile(file.name, extension);
    
    return {
      type: 'file',
      name: file.name,
      size: file.size || 0,
      extension,
      category,
      language: this.detectLanguage(extension),
      url: file.html_url,
      lastModified: file.last_modified || null
    };
  }

  /**
   * Format name for YAML (handle spaces but preserve structure)
   */
  formatYamlName(name, isFile = false) {
    if (isFile) {
      // For files, keep the full name with extension
      return name.replace(/\s+/g, '-');
    } else {
      // For directories, get just the last part of the path
      const lastPart = name.split('/').pop() || name;
      return lastPart.replace(/\s+/g, '-');
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(filename) {
    const match = filename.match(/\.([^.]+)$/);
    return match ? match[1].toLowerCase() : '';
  }

  /**
   * Categorize files by type
   */
  categorizeFile(filename, extension) {
    const categories = {
      code: ['js', 'jsx', 'ts', 'tsx', 'py', 'java', 'cpp', 'c', 'h', 'cs', 'php', 'rb', 'go', 'rs', 'kt', 'swift'],
      config: ['json', 'yaml', 'yml', 'toml', 'ini', 'env', 'config'],
      docs: ['md', 'txt', 'rst', 'pdf', 'doc', 'docx'],
      styles: ['css', 'scss', 'sass', 'less', 'styl'],
      assets: ['png', 'jpg', 'jpeg', 'gif', 'svg', 'ico', 'webp'],
      data: ['csv', 'xml', 'sql', 'db', 'sqlite'],
      build: ['dockerfile', 'makefile', 'gradle', 'maven']
    };

    // Check by filename first
    const lowerName = filename.toLowerCase();
    if (lowerName.includes('readme')) return 'docs';
    if (lowerName.includes('package.json')) return 'config';
    if (lowerName.includes('dockerfile')) return 'build';
    if (lowerName.includes('makefile')) return 'build';

    // Check by extension
    for (const [category, extensions] of Object.entries(categories)) {
      if (extensions.includes(extension)) {
        return category;
      }
    }

    return 'other';
  }

  /**
   * Detect programming language
   */
  detectLanguage(extension) {
    const languages = {
      js: 'JavaScript',
      jsx: 'React',
      ts: 'TypeScript',
      tsx: 'React TypeScript',
      py: 'Python',
      java: 'Java',
      cpp: 'C++',
      c: 'C',
      h: 'C/C++',
      cs: 'C#',
      php: 'PHP',
      rb: 'Ruby',
      go: 'Go',
      rs: 'Rust',
      kt: 'Kotlin',
      swift: 'Swift',
      css: 'CSS',
      scss: 'SCSS',
      html: 'HTML',
      md: 'Markdown'
    };

    return languages[extension] || null;
  }

  /**
   * Convert repository tree to YAML format
   */
  convertToYAML(tree, repoInfo) {
    console.log('Converting tree to YAML:', tree);
    console.log('Tree has children:', tree.children ? tree.children.length : 'none');
    
    const yamlTree = {
      name: this.formatYamlName(repoInfo.name || 'Unknown-Repository', false),
      description: repoInfo.description || 'No description available',
      language: repoInfo.language || 'Multiple',
      type: 'repository',
      stars: repoInfo.stargazers_count || 0,
      forks: repoInfo.forks_count || 0,
      size: `${Math.round((repoInfo.size || 0) / 1024)}MB`,
      updated: new Date(repoInfo.updated_at).toLocaleDateString(),
      url: repoInfo.html_url,
      children: this.convertTreeToYAML(tree.children || [])
    };

    console.log('Final YAML structure:', yamlTree);
    return yamlTree;
  }

  /**
   * Recursively convert tree structure to YAML
   */
  convertTreeToYAML(items) {
    console.log('Converting items to YAML:', items.length, 'items');
    
    return items.map(item => {
      console.log('Processing item:', item.name, item.type);
      
      if (item.type === 'directory') {
        const node = {
          name: this.formatYamlName(item.name, false),
          type: 'directory'
        };

        // Add directory size if available (count of children)
        if (item.children && item.children.length > 0) {
          console.log(`Directory ${item.name} has ${item.children.length} children`);
          node.size = `${item.children.length} items`;
          node.children = this.convertTreeToYAML(item.children);
        } else {
          console.log(`Directory ${item.name} has no children`);
          node.size = '0 items';
        }

        return node;
      } else {
        const node = {
          name: this.formatYamlName(item.name, true), // Keep full filename with extension
          type: 'file'
        };

        if (item.category && item.category !== 'other') {
          node.category = item.category;
        }

        if (item.language) {
          node.language = item.language;
        }

        if (item.size && item.size > 0) {
          node.size = this.formatFileSize(item.size);
        }

        if (item.extension) {
          node.extension = item.extension;
        }

        return node;
      }
    });
  }

  /**
   * Format file size for display
   */
  formatFileSize(bytes) {
    if (bytes === 0) return '0B';
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return Math.round(bytes / Math.pow(1024, i) * 100) / 100 + sizes[i];
  }

  /**
   * Analyze repository structure
   */
  analyzeRepository(tree, repoInfo) {
    const analysis = {
      totalFiles: 0,
      totalDirectories: 0,
      languages: new Set(),
      categories: {},
      largestFiles: [],
      depth: 0
    };

    this.analyzeNode(tree, analysis, 0);

    return {
      ...analysis,
      languages: Array.from(analysis.languages),
      mainLanguage: repoInfo.language,
      projectType: this.detectProjectType(analysis),
      recommendations: this.generateRecommendations(analysis)
    };
  }

  /**
   * Recursively analyze tree nodes
   */
  analyzeNode(node, analysis, depth) {
    analysis.depth = Math.max(analysis.depth, depth);

    if (node.type === 'directory') {
      analysis.totalDirectories++;
      if (node.children) {
        node.children.forEach(child => 
          this.analyzeNode(child, analysis, depth + 1)
        );
      }
    } else {
      analysis.totalFiles++;
      
      if (node.language) {
        analysis.languages.add(node.language);
      }

      if (node.category) {
        analysis.categories[node.category] = 
          (analysis.categories[node.category] || 0) + 1;
      }

      if (node.size > 0) {
        analysis.largestFiles.push({
          name: node.name,
          size: node.size,
          category: node.category
        });
      }
    }
  }

  /**
   * Detect project type based on structure
   */
  detectProjectType(analysis) {
    const { categories, languages } = analysis;

    if (categories.code && languages.has('React')) {
      return 'React Application';
    }
    if (categories.code && languages.has('JavaScript')) {
      return 'Node.js Project';
    }
    if (categories.code && languages.has('Python')) {
      return 'Python Project';
    }
    if (categories.code && languages.has('Java')) {
      return 'Java Application';
    }
    
    return 'General Project';
  }

  /**
   * Generate recommendations for repository structure
   */
  generateRecommendations(analysis) {
    const recommendations = [];

    if (!analysis.categories.docs) {
      recommendations.push('Consider adding documentation (README, docs folder)');
    }

    if (analysis.depth > 8) {
      recommendations.push('Deep directory structure - consider flattening');
    }

    if (analysis.totalFiles > 500) {
      recommendations.push('Large repository - consider modularization');
    }

    if (!analysis.categories.config) {
      recommendations.push('Add configuration files for better project setup');
    }

    return recommendations;
  }

  /**
   * Main method to process GitHub repository
   */
  async processRepository(url) {
    try {
      // Parse URL
      const { owner, repo } = this.parseGitHubURL(url);
      
      // Get repository info
      const repoInfo = await this.getRepositoryInfo(owner, repo);
      
      // Get repository tree
      const tree = await this.getRepositoryTree(owner, repo);
      
      // Convert to YAML
      const yamlStructure = this.convertToYAML(tree, repoInfo);
      
      // Analyze structure
      const analysis = this.analyzeRepository(tree, repoInfo);
      
      return {
        yaml: yamlStructure,
        analysis,
        repoInfo,
        success: true
      };
      
    } catch (error) {
      return {
        error: error.message,
        success: false
      };
    }
  }
}

// Export singleton instance
export default new GitHubService();