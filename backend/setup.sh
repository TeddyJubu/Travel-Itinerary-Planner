#!/bin/bash

# Create Django project
django-admin startproject travel_planner .

# Create main app
python manage.py startapp travel_app

# Create necessary directories
mkdir -p travel_app/templates
mkdir -p travel_app/static 