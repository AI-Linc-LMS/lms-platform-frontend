/** @jsxImportSource @emotion/react */
import { jsx } from '@emotion/react';
import React, { Suspense } from 'react';
import type { ReactElement, JSXElementConstructor } from 'react';
import CourseBuilder from '../components/CourseBuilder';

const CourseBuilderPage = (): ReactElement<any, string | JSXElementConstructor<any>> => {
  return (
    <div css={{ margin: '0 auto', padding: '2rem 1rem' }}>
      <Suspense fallback={<div>Loading course builder...</div>}>
        <CourseBuilder />
      </Suspense>
    </div>
  );
};

export default CourseBuilderPage; 