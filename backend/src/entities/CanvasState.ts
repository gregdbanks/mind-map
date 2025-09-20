import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, Index } from 'typeorm'
import { MindMap } from './MindMap'

@Entity('canvas_states')
export class CanvasState {
  @PrimaryGeneratedColumn('uuid')
  id!: string

  @Column({ unique: true })
  @Index()
  mindMapId!: string

  @Column('float', { default: 1.0 })
  zoom!: number

  @Column('float', { default: 0 })
  panX!: number

  @Column('float', { default: 0 })
  panY!: number

  @OneToOne(() => MindMap, mindMap => mindMap.canvasState, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'mindMapId' })
  mindMap!: MindMap
}