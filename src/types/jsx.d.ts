import React from 'react';

declare global {
  namespace JSX {
    interface Element extends React.ReactElement<any, any> { }
    interface ElementClass extends React.Component<any> {
      render(): React.ReactNode;
    }
    interface ElementAttributesProperty { props: {}; }
    interface ElementChildrenAttribute { children: {}; }
    interface IntrinsicAttributes extends React.Attributes { }
    interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }
    interface IntrinsicElements {
      [elemName: string]: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}

declare module 'react' {
  interface FunctionComponent<P = {}> {
    (props: P, context?: any): React.ReactElement<any, any> | null;
  }
}

declare module 'react-markdown' {
  import { ComponentType, ComponentPropsWithoutRef } from 'react';
  
  export interface ReactMarkdownProps {
    children: string;
    components?: {
      [key: string]: ComponentType<any>;
    };
  }

  export type TagName = keyof JSX.IntrinsicElements;
  
  const ReactMarkdown: ComponentType<ReactMarkdownProps>;
  export default ReactMarkdown;
} 