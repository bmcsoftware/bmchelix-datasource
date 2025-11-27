import { AnnotationQuery } from '@grafana/data';

interface AnnotationComponentProps {
  annotation: AnnotationQuery<{ query: string; refId: string }>;
  onAnnotationQueryChange: (update: any) => void;
}

export { AnnotationComponentProps };
