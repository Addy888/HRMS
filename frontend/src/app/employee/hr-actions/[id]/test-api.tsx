'use client';

/**
 * DIAGNOSTIC TOOL - HR Action API Testing
 * 
 * This page will help identify why HR Action data is not displaying.
 * Navigate to: /employee/hr-actions/{id}/test-api
 */

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import api from '@/lib/api';

export default function TestHRActionAPI() {
  const params = useParams();
  const actionId = params.id as string;
  const [results, setResults] = useState<any>({});

  useEffect(() => {
    async function runTests() {
      const testResults: any = {
        actionId,
        timestamp: new Date().toISOString(),
        tests: {},
      };

      // Test 1: Direct API call
      try {
        console.log('TEST 1: Calling API directly...');
        const response = await api.get(`/hr-actions/${actionId}`);
        testResults.tests.directCall = {
          success: true,
          status: response.status,
          statusText: response.statusText,
          headers: response.headers,
          data: response.data,
          dataType: typeof response.data,
          dataKeys: response.data ? Object.keys(response.data) : [],
          hasActionType: response.data?.actionType !== undefined,
          hasSubject: response.data?.subject !== undefined,
          hasReason: response.data?.reason !== undefined,
        };
        console.log('TEST 1 SUCCESS:', testResults.tests.directCall);
      } catch (error: any) {
        testResults.tests.directCall = {
          success: false,
          error: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          responseData: error.response?.data,
        };
        console.error('TEST 1 FAILED:', testResults.tests.directCall);
      }

      // Test 2: Check authentication
      try {
        console.log('TEST 2: Checking authentication...');
        const token = localStorage.getItem('fcs_token') || 
                     localStorage.getItem('fcs-auth-storage');
        testResults.tests.auth = {
          hasToken: !!token,
          tokenLength: token?.length || 0,
        };
        console.log('TEST 2 RESULT:', testResults.tests.auth);
      } catch (error: any) {
        testResults.tests.auth = {
          error: error.message,
        };
      }

      // Test 3: Try alternative endpoints
      const alternativeEndpoints = [
        `/hr-actions/${actionId}`,
        `/hr-actions/my/actions`,
        `/employee/hr-actions/${actionId}`,
      ];

      testResults.tests.alternativeEndpoints = {};
      for (const endpoint of alternativeEndpoints) {
        try {
          console.log(`TEST 3: Trying ${endpoint}...`);
          const response = await api.get(endpoint);
          testResults.tests.alternativeEndpoints[endpoint] = {
            success: true,
            status: response.status,
            dataKeys: response.data ? Object.keys(response.data) : [],
          };
          console.log(`TEST 3 ${endpoint} SUCCESS`);
        } catch (error: any) {
          testResults.tests.alternativeEndpoints[endpoint] = {
            success: false,
            status: error.response?.status,
            error: error.message,
          };
          console.log(`TEST 3 ${endpoint} FAILED:`, error.message);
        }
      }

      setResults(testResults);
      console.log('ALL TESTS COMPLETE:', testResults);
    }

    if (actionId) {
      runTests();
    }
  }, [actionId]);

  return (
    <div style={{ padding: '20px', fontFamily: 'monospace', backgroundColor: '#1a1a1a', color: '#fff', minHeight: '100vh' }}>
      <h1 style={{ color: '#4ade80' }}>HR Action API Diagnostic Tool</h1>
      <p style={{ color: '#94a3b8' }}>Action ID: {actionId}</p>
      
      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#262626', borderRadius: '8px' }}>
        <h2 style={{ color: '#60a5fa' }}>Test Results</h2>
        <pre style={{ 
          backgroundColor: '#000', 
          padding: '15px', 
          borderRadius: '4px', 
          overflow: 'auto',
          fontSize: '12px',
          lineHeight: '1.5'
        }}>
          {JSON.stringify(results, null, 2)}
        </pre>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#262626', borderRadius: '8px' }}>
        <h2 style={{ color: '#f59e0b' }}>Instructions</h2>
        <ol style={{ lineHeight: '2' }}>
          <li>Open browser DevTools (F12)</li>
          <li>Go to Console tab</li>
          <li>Look for logs starting with "TEST"</li>
          <li>Check the "Test Results" JSON above</li>
          <li>Copy ALL of this and send it to me</li>
        </ol>
      </div>

      <div style={{ marginTop: '20px', padding: '20px', backgroundColor: '#262626', borderRadius: '8px' }}>
        <h2 style={{ color: '#ec4899' }}>What to Check</h2>
        <ul style={{ lineHeight: '2' }}>
          <li><strong>directCall.success:</strong> Did the API call work?</li>
          <li><strong>directCall.status:</strong> HTTP status code (should be 200)</li>
          <li><strong>directCall.dataKeys:</strong> What fields did the API return?</li>
          <li><strong>directCall.hasActionType:</strong> Is actionType field present?</li>
          <li><strong>directCall.hasSubject:</strong> Is subject field present?</li>
          <li><strong>directCall.hasReason:</strong> Is reason field present?</li>
          <li><strong>auth.hasToken:</strong> Is user authenticated?</li>
        </ul>
      </div>
    </div>
  );
}
