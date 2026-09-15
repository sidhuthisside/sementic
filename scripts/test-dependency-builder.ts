
import { DependencyBuilder } from '../lib/analyzer/DependencyBuilder';

async function test() {
    console.log("Starting DependencyBuilder Test...");
    const builder = new DependencyBuilder();

    const files = [
        {
            name: 'main.ts',
            content: `
                import { Component } from '@angular/core';
                import { Helper } from './utils/helper';
                import * as fs from 'fs';
                
                export class AppComponent {}
            `
        },
        {
            name: 'utils/helper.ts',
            content: `
                import { Other } from './other';
                export class Helper {}
            `
        },
        {
            name: 'script.py',
            content: `
                import os
                from utils import helper
                import tensorflow as tf
            `
        },
        {
            name: 'main.go',
            content: `
                package main
                import (
                    "fmt"
                    "net/http"
                    "github.com/gin-gonic/gin"
                )
            `
        }
    ];

    try {
        const graph = await builder.buildGraph(files);
        console.log("Graph built successfully!");
        console.log(JSON.stringify(graph, null, 2));
    } catch (e) {
        console.error("Error building graph:", e);
    }
}

test();
