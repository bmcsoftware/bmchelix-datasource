import { AnnotationQuery } from '@grafana/data';

export default function migrateAnnotation(annotation: AnnotationQuery<any>) {
  return {
    ...annotation,
    query: annotation.query,
  };
}
