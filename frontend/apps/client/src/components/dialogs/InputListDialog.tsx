import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Field, FieldError } from '@/components/ui/field';
import { Button } from '../ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';

import * as z from 'zod';

const formSchema = z.object({
  hanziList: z.string().min(1, 'Please enter at least one Hanzi character.'),
});

type formSchemaType = z.infer<typeof formSchema>;

function InputListDialog({
  setList,
  setQuizIndex,
  setQuizSubindex,
  children,
}: {
  setList: (list: string[]) => void;
  setQuizIndex: (value: number) => void;
  setQuizSubindex: (value: number) => void;
  children: string;
}) {
  const form = useForm<formSchemaType>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      hanziList: '',
    },
  });

  const onSubmit = (data: formSchemaType) => {
    const list = data.hanziList
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0 && /\p{Script=Han}/u.test(line));
    console.log(list);
    setList(list);
    setQuizIndex(0);
    setQuizSubindex(-1);
    toast.success('Hanzi list updated successfully!', {
      style: {
        '--normal-bg':
          'color-mix(in oklab, light-dark(var(--color-green-600), var(--color-green-400)) 10%, var(--background))',
        '--normal-text':
          'light-dark(var(--color-green-600), var(--color-green-400))',
        '--normal-border':
          'light-dark(var(--color-green-600), var(--color-green-400))',
      } as React.CSSProperties,
    });
  };

  return (
    <>
      <Dialog>
        <DialogTrigger render={<Button />}>{children}</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Write or paste a list of Hanzi</DialogTitle>
            <DialogDescription>
              Make sure to only write 1 character per line
            </DialogDescription>
            <form id="form-input-list" onSubmit={form.handleSubmit(onSubmit)}>
              <Controller
                name="hanziList"
                control={form.control}
                render={({ field, fieldState }) => (
                  <Field>
                    <Textarea
                      {...field}
                      id="form-input-list-list"
                      aria-invalid={fieldState.invalid}
                      placeholder="Write or paste your list here"
                      autoComplete="off"
                      className="max-h-48"
                    />
                    {fieldState.invalid && (
                      <FieldError errors={[fieldState.error]} />
                    )}
                  </Field>
                )}
              />
            </form>
          </DialogHeader>
          <DialogFooter>
            <DialogClose render={<Button variant={'destructive'} />}>Cancel</DialogClose>
            <DialogClose render={<Button type="submit" form="form-input-list" />}>
              Continue
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default InputListDialog;
