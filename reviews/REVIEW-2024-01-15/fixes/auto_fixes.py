#!/usr/bin/env python3
"""
Automated Fix Script for Travel Itinerary Planner

This script automatically applies simple, safe fixes identified in the code review.
Run this script from the project root directory.

Usage:
    python reviews/REVIEW-2024-01-15/fixes/auto_fixes.py
"""

import os
import re
import json
import shutil
from pathlib import Path
from typing import List, Dict, Any

class AutoFixer:
    """
    Automated code fixer for common issues.
    Only applies safe, non-breaking changes.
    """
    
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.backend_dir = self.project_root / 'backend'
        self.frontend_dir = self.project_root / 'frontend'
        self.fixes_applied = []
        self.errors = []
    
    def run_all_fixes(self) -> Dict[str, Any]:
        """
        Run all automated fixes and return a summary.
        """
        print("🔧 Starting automated fixes...")
        
        # Backend fixes
        self.fix_django_settings()
        self.add_logging_config()
        self.create_gitignore_entries()
        
        # Frontend fixes
        self.fix_package_json_scripts()
        self.add_eslint_config()
        self.add_prettier_config()
        
        # General fixes
        self.create_env_example_files()
        self.add_requirements_txt()
        
        return {
            'fixes_applied': self.fixes_applied,
            'errors': self.errors,
            'total_fixes': len(self.fixes_applied)
        }
    
    def fix_django_settings(self):
        """
        Fix basic Django settings issues.
        """
        settings_file = self.backend_dir / 'travel_planner' / 'settings.py'
        
        if not settings_file.exists():
            self.errors.append("Django settings.py not found")
            return
        
        try:
            with open(settings_file, 'r') as f:
                content = f.read()
            
            original_content = content
            
            # Fix ALLOWED_HOSTS
            if "ALLOWED_HOSTS = ['*']" in content:
                content = content.replace(
                    "ALLOWED_HOSTS = ['*']",
                    """# Security: Restrict allowed hosts
ALLOWED_HOSTS = [
    'localhost',
    '127.0.0.1',
    # Add your production domain here
    # 'your-domain.com',
]

# Allow all hosts in development only
import os
if os.getenv('DEBUG', 'False').lower() == 'true':
    ALLOWED_HOSTS.extend(['*'])"""
                )
                self.fixes_applied.append("Fixed ALLOWED_HOSTS security issue")
            
            # Add logging configuration if not present
            if 'LOGGING' not in content:
                logging_config = """

# Logging configuration
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
        'simple': {
            'format': '{levelname} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'file': {
            'level': 'INFO',
            'class': 'logging.FileHandler',
            'filename': 'django.log',
            'formatter': 'verbose',
        },
        'console': {
            'level': 'DEBUG',
            'class': 'logging.StreamHandler',
            'formatter': 'simple',
        },
    },
    'root': {
        'handlers': ['console', 'file'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console', 'file'],
            'level': 'INFO',
            'propagate': False,
        },
        'travel_app': {
            'handlers': ['console', 'file'],
            'level': 'DEBUG',
            'propagate': False,
        },
    },
}"""
                content += logging_config
                self.fixes_applied.append("Added logging configuration")
            
            # Only write if changes were made
            if content != original_content:
                # Create backup
                shutil.copy2(settings_file, f"{settings_file}.backup")
                
                with open(settings_file, 'w') as f:
                    f.write(content)
                
                print(f"✅ Updated {settings_file}")
            
        except Exception as e:
            self.errors.append(f"Error fixing Django settings: {str(e)}")
    
    def add_logging_config(self):
        """
        Replace print statements with proper logging in views.
        """
        views_file = self.backend_dir / 'travel_app' / 'views.py'
        
        if not views_file.exists():
            return
        
        try:
            with open(views_file, 'r') as f:
                content = f.read()
            
            original_content = content
            
            # Add logging import if not present
            if 'import logging' not in content:
                # Find the first import line and add logging import
                lines = content.split('\n')
                import_index = 0
                for i, line in enumerate(lines):
                    if line.strip().startswith('import ') or line.strip().startswith('from '):
                        import_index = i
                        break
                
                lines.insert(import_index, 'import logging')
                lines.insert(import_index + 1, '')
                lines.insert(import_index + 2, '# Set up logger for this module')
                lines.insert(import_index + 3, 'logger = logging.getLogger(__name__)')
                lines.insert(import_index + 4, '')
                content = '\n'.join(lines)
                self.fixes_applied.append("Added logging import to views.py")
            
            # Replace print statements with logger calls
            print_pattern = r'print\(([^)]+)\)'
            matches = re.findall(print_pattern, content)
            
            if matches:
                content = re.sub(
                    print_pattern,
                    r'logger.info(\1)',
                    content
                )
                self.fixes_applied.append(f"Replaced {len(matches)} print statements with logging")
            
            # Only write if changes were made
            if content != original_content:
                # Create backup
                shutil.copy2(views_file, f"{views_file}.backup")
                
                with open(views_file, 'w') as f:
                    f.write(content)
                
                print(f"✅ Updated {views_file}")
        
        except Exception as e:
            self.errors.append(f"Error updating views.py: {str(e)}")
    
    def create_gitignore_entries(self):
        """
        Add important entries to .gitignore.
        """
        gitignore_file = self.project_root / '.gitignore'
        
        # Important entries that should be in .gitignore
        important_entries = [
            '# Security - Firebase service account',
            'firebase-service-account.json',
            '',
            '# Environment variables',
            '.env',
            '.env.local',
            '.env.production',
            '',
            '# Logs',
            '*.log',
            'logs/',
            '',
            '# Database',
            '*.sqlite3',
            'db.sqlite3',
            '',
            '# Python cache',
            '__pycache__/',
            '*.pyc',
            '*.pyo',
            '',
            '# Node modules',
            'node_modules/',
            '',
            '# Build outputs',
            'build/',
            'dist/',
            '',
            '# IDE files',
            '.vscode/',
            '.idea/',
            '*.swp',
            '*.swo',
            '',
            '# OS files',
            '.DS_Store',
            'Thumbs.db',
        ]
        
        try:
            existing_content = ''
            if gitignore_file.exists():
                with open(gitignore_file, 'r') as f:
                    existing_content = f.read()
            
            # Check which entries are missing
            missing_entries = []
            for entry in important_entries:
                if entry and not entry.startswith('#') and entry not in existing_content:
                    missing_entries.append(entry)
            
            if missing_entries:
                with open(gitignore_file, 'a') as f:
                    f.write('\n\n# Added by auto-fixer\n')
                    for entry in important_entries:
                        if not entry or entry.startswith('#') or entry in existing_content:
                            continue
                        f.write(f'{entry}\n')
                
                self.fixes_applied.append(f"Added {len(missing_entries)} entries to .gitignore")
                print(f"✅ Updated .gitignore")
        
        except Exception as e:
            self.errors.append(f"Error updating .gitignore: {str(e)}")
    
    def fix_package_json_scripts(self):
        """
        Add useful scripts to package.json.
        """
        package_json_file = self.frontend_dir / 'package.json'
        
        if not package_json_file.exists():
            return
        
        try:
            with open(package_json_file, 'r') as f:
                package_data = json.load(f)
            
            # Add useful scripts if they don't exist
            scripts_to_add = {
                'lint': 'eslint src --ext .ts,.tsx,.js,.jsx',
                'lint:fix': 'eslint src --ext .ts,.tsx,.js,.jsx --fix',
                'format': 'prettier --write src/**/*.{ts,tsx,js,jsx,css,md}',
                'format:check': 'prettier --check src/**/*.{ts,tsx,js,jsx,css,md}',
                'type-check': 'tsc --noEmit',
                'analyze': 'npm run build && npx bundle-analyzer build/static/js/*.js'
            }
            
            if 'scripts' not in package_data:
                package_data['scripts'] = {}
            
            added_scripts = []
            for script_name, script_command in scripts_to_add.items():
                if script_name not in package_data['scripts']:
                    package_data['scripts'][script_name] = script_command
                    added_scripts.append(script_name)
            
            if added_scripts:
                with open(package_json_file, 'w') as f:
                    json.dump(package_data, f, indent=2)
                
                self.fixes_applied.append(f"Added scripts to package.json: {', '.join(added_scripts)}")
                print(f"✅ Updated package.json")
        
        except Exception as e:
            self.errors.append(f"Error updating package.json: {str(e)}")
    
    def add_eslint_config(self):
        """
        Create basic ESLint configuration.
        """
        eslint_file = self.frontend_dir / '.eslintrc.json'
        
        if eslint_file.exists():
            return  # Don't overwrite existing config
        
        eslint_config = {
            "extends": [
                "react-app",
                "react-app/jest"
            ],
            "rules": {
                "no-console": "warn",
                "no-debugger": "error",
                "no-unused-vars": "warn",
                "prefer-const": "error",
                "no-var": "error",
                "eqeqeq": "error",
                "curly": "error"
            },
            "env": {
                "browser": True,
                "es6": True,
                "node": True
            }
        }
        
        try:
            with open(eslint_file, 'w') as f:
                json.dump(eslint_config, f, indent=2)
            
            self.fixes_applied.append("Created ESLint configuration")
            print(f"✅ Created {eslint_file}")
        
        except Exception as e:
            self.errors.append(f"Error creating ESLint config: {str(e)}")
    
    def add_prettier_config(self):
        """
        Create basic Prettier configuration.
        """
        prettier_file = self.frontend_dir / '.prettierrc.json'
        
        if prettier_file.exists():
            return  # Don't overwrite existing config
        
        prettier_config = {
            "semi": True,
            "trailingComma": "es5",
            "singleQuote": True,
            "printWidth": 80,
            "tabWidth": 2,
            "useTabs": False
        }
        
        try:
            with open(prettier_file, 'w') as f:
                json.dump(prettier_config, f, indent=2)
            
            self.fixes_applied.append("Created Prettier configuration")
            print(f"✅ Created {prettier_file}")
        
        except Exception as e:
            self.errors.append(f"Error creating Prettier config: {str(e)}")
    
    def create_env_example_files(self):
        """
        Create example environment files.
        """
        # Backend .env.example
        backend_env_example = self.backend_dir / '.env.example'
        if not backend_env_example.exists():
            env_content = """# Django Configuration
DEBUG=True
SECRET_KEY=your-secret-key-here
ALLOWED_HOSTS=localhost,127.0.0.1

# Database (for production)
# DATABASE_URL=postgres://user:password@localhost:5432/dbname

# GROQ API
GROQ_API_KEY=your-groq-api-key-here

# Firebase (for authentication)
FIREBASE_PROJECT_ID=your-firebase-project-id

# CORS Settings
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000
"""
            
            try:
                with open(backend_env_example, 'w') as f:
                    f.write(env_content)
                
                self.fixes_applied.append("Created backend .env.example")
                print(f"✅ Created {backend_env_example}")
            
            except Exception as e:
                self.errors.append(f"Error creating backend .env.example: {str(e)}")
        
        # Frontend .env.example
        frontend_env_example = self.frontend_dir / '.env.example'
        if not frontend_env_example.exists():
            env_content = """# API Configuration
REACT_APP_API_URL=http://localhost:8000

# Firebase Configuration
REACT_APP_FIREBASE_API_KEY=your-firebase-api-key
REACT_APP_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your-project-id
REACT_APP_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=123456789
REACT_APP_FIREBASE_APP_ID=1:123456789:web:abcdef123456
"""
            
            try:
                with open(frontend_env_example, 'w') as f:
                    f.write(env_content)
                
                self.fixes_applied.append("Created frontend .env.example")
                print(f"✅ Created {frontend_env_example}")
            
            except Exception as e:
                self.errors.append(f"Error creating frontend .env.example: {str(e)}")
    
    def add_requirements_txt(self):
        """
        Create or update requirements.txt with proper versions.
        """
        requirements_file = self.backend_dir / 'requirements.txt'
        
        # Basic requirements with versions
        basic_requirements = [
            'Django>=4.2.0,<5.0.0',
            'djangorestframework>=3.14.0',
            'django-cors-headers>=4.0.0',
            'firebase-admin>=6.0.0',
            'groq>=0.4.0',
            'python-decouple>=3.8',  # For environment variables
            'gunicorn>=21.0.0',  # For production
            'psycopg2-binary>=2.9.0',  # For PostgreSQL
            'whitenoise>=6.5.0',  # For static files
        ]
        
        try:
            existing_requirements = []
            if requirements_file.exists():
                with open(requirements_file, 'r') as f:
                    existing_requirements = [line.strip() for line in f.readlines() if line.strip()]
            
            # Check which requirements are missing
            existing_packages = [req.split('>=')[0].split('==')[0] for req in existing_requirements]
            missing_requirements = []
            
            for req in basic_requirements:
                package_name = req.split('>=')[0].split('==')[0]
                if package_name not in existing_packages:
                    missing_requirements.append(req)
            
            if missing_requirements:
                with open(requirements_file, 'a') as f:
                    f.write('\n# Added by auto-fixer\n')
                    for req in missing_requirements:
                        f.write(f'{req}\n')
                
                self.fixes_applied.append(f"Added {len(missing_requirements)} packages to requirements.txt")
                print(f"✅ Updated requirements.txt")
        
        except Exception as e:
            self.errors.append(f"Error updating requirements.txt: {str(e)}")

def main():
    """
    Main function to run the auto-fixer.
    """
    # Get project root (assuming script is run from project root)
    project_root = os.getcwd()
    
    # Check if we're in the right directory
    if not os.path.exists(os.path.join(project_root, 'backend')) or not os.path.exists(os.path.join(project_root, 'frontend')):
        print("❌ Error: Please run this script from the project root directory")
        print("   Expected structure: project_root/backend and project_root/frontend")
        return
    
    # Run the auto-fixer
    fixer = AutoFixer(project_root)
    results = fixer.run_all_fixes()
    
    # Print summary
    print("\n" + "="*50)
    print("🎉 AUTO-FIXER SUMMARY")
    print("="*50)
    
    if results['fixes_applied']:
        print(f"\n✅ Applied {results['total_fixes']} fixes:")
        for fix in results['fixes_applied']:
            print(f"   • {fix}")
    
    if results['errors']:
        print(f"\n❌ Encountered {len(results['errors'])} errors:")
        for error in results['errors']:
            print(f"   • {error}")
    
    if not results['fixes_applied'] and not results['errors']:
        print("\n✨ No fixes needed - everything looks good!")
    
    print("\n📝 Next steps:")
    print("   1. Review the changes made")
    print("   2. Test your application")
    print("   3. Commit the changes")
    print("   4. Follow the Implementation Guide for manual fixes")
    
    print("\n" + "="*50)

if __name__ == '__main__':
    main()